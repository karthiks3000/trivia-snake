# lambda_function.py

import base64
from decimal import Decimal
import json
import boto3
from boto3.dynamodb.conditions import Key
import os
import uuid
import boto3

bedrock = boto3.client('bedrock-runtime', region_name="us-east-1")


dynamodb = boto3.resource('dynamodb')
s3 = boto3.client('s3')
bedrock = boto3.client('bedrock-runtime')

leaderboard_table_name = os.environ['LEADERBOARD_TABLE_NAME']
adventure_table_name = os.environ['ADVENTURE_TABLE_NAME']
adventure_images_bucket = os.environ['ADVENTURE_IMAGES_BUCKET']

# Create the table objects
leaderboard_table = dynamodb.Table(leaderboard_table_name)
adventure_table = dynamodb.Table(adventure_table_name)


# Custom JSON encoder to handle Decimal types
class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)
    
def lambda_handler(event, context):
    http_method = event['httpMethod']
    path = event['path']
    
    if path == '/leaderboard':
        if http_method == 'GET':
            return get_leaderboard()
        elif http_method == 'POST':
            return save_score(json.loads(event['body']))
    elif path == '/adventures':
        if http_method == 'GET':
            return get_adventures()
        elif http_method == 'POST':
            if not event.get('body'):
                return {
                    'statusCode': 400,
                    'headers': get_cors_headers(),
                    'body': json.dumps({'error': 'Empty request body'})
                }
            try:
                body = json.loads(event['body'])
            except json.JSONDecodeError:
                return {
                    'statusCode': 400,
                    'headers': get_cors_headers(),
                    'body': json.dumps({'error': 'Invalid JSON in request body'})
                }
            return create_adventure(body)
    elif path.startswith('/adventures/'):
        adventure_id = path.split('/')[-1]
        if http_method == 'GET':
            return get_adventure(adventure_id)
        elif http_method == 'PUT':
            return update_adventure(adventure_id, json.loads(event['body']))
        elif http_method == 'DELETE':
            return delete_adventure(adventure_id)
    elif path == '/generate-quiz':
        if http_method == 'POST':
            return generate_quiz(json.loads(event['body']))
    
    return {
        'statusCode': 400,
        'headers': get_cors_headers(),
        'body': json.dumps({'error': 'Unsupported HTTP method or path'})
    }

def get_cors_headers():
    return {
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,PUT,DELETE'
    }

def get_adventures():
    response = adventure_table.scan()   
    adventures = response['Items']
    
    return {
        'statusCode': 200,
        'headers': get_cors_headers(),
        'body': json.dumps(adventures, cls=DecimalEncoder)
    }

def create_adventure(body):
    try:
        adventure_id = str(uuid.uuid4())
        name = body.get('name')
        image_data = body.get('image')
        questions = body.get('questions')
        created_by = body.get('createdBy')
        genre = body.get('genre')
        
        if not name or not image_data or not questions or not created_by or not genre:
            return {
                'statusCode': 400,
                'headers': get_cors_headers(),
                'body': json.dumps({'error': 'Name, image data, questions, creator ID, and genre are required'})
            }
        
        # Perform profanity check using Bedrock AI
        content_to_check = f"{name}\n{json.dumps(questions)}"
        profanity_check_result = check_profanity(content_to_check)
        
        if not profanity_check_result['is_appropriate']:
            return {
                'statusCode': 400,
                'headers': get_cors_headers(),
                'body': json.dumps({'error': f"Adventure content contains inappropriate language: {profanity_check_result['reason']}. Please revise and try again."})
            }
        
        # Set initial verification status
        verification_status = 'verified'
        print('adventure verified')
        
        # Decode base64 image data
        # Check if the body is base64 encoded
        try:
            image_binary = base64.b64decode(image_data.split(',')[1])
        except e:
            print("Body is not base64 encoded")
            return {
                'statusCode': 500,
                'headers': get_cors_headers(),
                'body': json.dumps({'error': str(e)})
            }
        
        # Generate a unique filename
        image_filename = f"{adventure_id}.jpg"
        print(image_filename)
        try:
            # Upload image to S3
            s3.put_object(
                Bucket=adventure_images_bucket,
                Key=image_filename,
                Body=image_binary,
                ContentType='image/jpeg'
            )
        except e:
            print("error uploading to s3")
            return {
                'statusCode': 500,
                'headers': get_cors_headers(),
                'body': json.dumps({'error': str(e)})
            }
        
        # Generate the image URL
        image_url = f"https://{adventure_images_bucket}.s3.amazonaws.com/{image_filename}"
        print(image_url)
        adventure_table.put_item(
            Item={
                'id': adventure_id,
                'name': name,
                'image_url': image_url,
                'questions': questions,
                'createdBy': created_by,
                'verificationStatus': verification_status,
                'genre': genre
            }
        )
        print('adventure created')
        return {
            'statusCode': 201,
            'headers': get_cors_headers(),
            'body': json.dumps({
                'id': adventure_id,
                'image_url': image_url,
                'verificationStatus': verification_status,
                'message': 'Adventure created successfully. It will be available to all users.'
            })
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': get_cors_headers(),
            'body': json.dumps({'error': str(e)})
        }

def get_adventure(adventure_id):
    response = adventure_table.get_item(Key={'id': adventure_id})
    adventure = response.get('Item')
    
    if not adventure:
        return {
            'statusCode': 404,
            'headers': get_cors_headers(),
            'body': json.dumps({'error': 'Adventure not found'})
        }
    
    return {
        'statusCode': 200,
        'headers': get_cors_headers(),
        'body': json.dumps(adventure, cls=DecimalEncoder)
    }

def update_adventure(adventure_id, body):
    name = body.get('name')
    image_url = body.get('image_url')
    questions = body.get('questions')
    genre = body.get('genre')
    
    if not name or not image_url or not questions or not genre:
        return {
            'statusCode': 400,
            'headers': get_cors_headers(),
            'body': json.dumps({'error': 'Name, image URL, questions, and genre are required'})
        }
    
    adventure_table.update_item(
        Key={'id': adventure_id},
        UpdateExpression='SET #name = :name, image_url = :image_url, questions = :questions, genre = :genre',
        ExpressionAttributeNames={'#name': 'name'},
        ExpressionAttributeValues={
            ':name': name,
            ':image_url': image_url,
            ':questions': questions,
            ':genre': genre
        }
    )
    
    return {
        'statusCode': 200,
        'headers': get_cors_headers(),
        'body': json.dumps({'message': 'Adventure updated successfully'})
    }

def delete_adventure(adventure_id):
    adventure_table.delete_item(Key={'id': adventure_id})
    
    return {
        'statusCode': 200,
        'headers': get_cors_headers(),
        'body': json.dumps({'message': 'Adventure deleted successfully'})
    }

def check_profanity(content):
    prompt = f"""
    Analyze the following content for any profanity, vulgarity, or inappropriate language and determine if the content is appropriate for all ages. Respond with only a JSON object containing:
    1. 'is_appropriate': A boolean indicating if the content is appropriate (true) or not (false).
    2. 'reason': If not appropriate, provide a brief explanation of why.
    {content}
    """

    conversation = [
        {
            "role": "user",
            "content": [{"text": prompt}],
        }
    ]
    response = bedrock.converse(
        modelId="us.anthropic.claude-3-5-haiku-20241022-v1:0",
        messages=conversation,
        inferenceConfig={"maxTokens":4096,"temperature":1},
        additionalModelRequestFields={"top_k":250}
    )

    # Extract and print the response text.
    response_text = response["output"]["message"]["content"][0]["text"]
    print(response_text)
    return json.loads(response_text)

def generate_quiz(body):
    prompt = body.get('prompt')
    
    if not prompt:
        return {
            'statusCode': 400,
            'headers': get_cors_headers(),
            'body': json.dumps({'error': 'Prompt is required'})
        }
    
    try:
        # Prepare the prompt for the Bedrock AI model
        bedrock_prompt = f"Generate a trivia quiz with 10 questions based on the following topic: {prompt}. For each question, provide 4 options and indicate the correct answer. Format the response as a JSON array of objects, where each object has 'question', 'options' (array of 4 strings), and 'correctAnswer' (string matching one of the options) keys."

        # Call Bedrock AI service
        response = bedrock.invoke_model(
            modelId="us.anthropic.claude-3-5-haiku-20241022-v1:0",
            contentType="application/json",
            accept="application/json",
            body=json.dumps({
                "prompt": bedrock_prompt,
                "max_tokens_to_sample": 500,
                "temperature": 1,
                "top_p": 1
            })
        )

        # Parse the response
        response_body = json.loads(response['body'].read())
        generated_text = response_body['completion']

        # Extract the JSON part from the generated text
        json_start = generated_text.find('[')
        json_end = generated_text.rfind(']') + 1
        questions_json = generated_text[json_start:json_end]

        # Parse the JSON and validate the structure
        questions = json.loads(questions_json)
        for question in questions:
            if not all(key in question for key in ('question', 'options', 'correctAnswer')):
                raise ValueError("Invalid question format in generated quiz")

        return {
            'statusCode': 200,
            'headers': get_cors_headers(),
            'body': json.dumps({'questions': questions})
        }
    except Exception as e:
        print(f"Error generating quiz: {str(e)}")
        return {
            'statusCode': 500,
            'headers': get_cors_headers(),
            'body': json.dumps({'error': 'Failed to generate quiz'})
        }

def get_leaderboard():
    try:
        response = leaderboard_table.scan()
        items = response['Items']
        # Sort the items, but don't limit to 10 yet
        sorted_items = sorted(items, key=lambda x: (-x['score'], x['time']))
        
        # Get the top scores (up to 10)
        top_scores = sorted_items[:10] if len(sorted_items) > 10 else sorted_items
        
        # Ensure we're returning both userId and username
        leaderboard_entries = [{
            'userId': item['userId'],
            'username': item['username'],
            'score': item['score'],
            'time': item['time'],
            'adventureId': item['adventureId'],
            'adventureName': item['adventureName']
        } for item in top_scores]
        
        return {
            'statusCode': 200,
            'headers': get_cors_headers(),
            'body': json.dumps(leaderboard_entries, cls=DecimalEncoder)
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': get_cors_headers(),
            'body': json.dumps({'error': f'Error fetching leaderboard: {str(e)}'})
        }

def save_score(body):
    user_id = body.get('userId')
    username = body.get('username')
    score = body.get('score')
    time = body.get('time')
    adventure_id = body.get('adventureId')
    adventure_name = body.get('adventureName')
    
    if not user_id or not username or score is None or time is None or not adventure_id or not adventure_name:
        return {
            'statusCode': 400,
            'headers': get_cors_headers(),
            'body': json.dumps({'error': 'UserId, username, score, time, adventureId, and adventureName are required'})
        }
    
    try:
        # Get the current record for the user and adventure
        response = leaderboard_table.get_item(Key={'userId': user_id, 'adventureId': adventure_id})
        new_item = {
            'userId': user_id,
            'username': username,
            'score': Decimal(str(score)),  # Convert to Decimal for DynamoDB
            'time': Decimal(str(time)),  # Convert to Decimal for DynamoDB
            'adventureId': adventure_id,
            'adventureName': adventure_name
        }
        
        if 'Item' in response:
            current_record = response['Item']
            # Update only if the new score is higher or if the scores are equal and the new time is lower
            if score > current_record['score'] or (score == current_record['score'] and time < current_record['time']):
                leaderboard_table.put_item(Item=new_item)
        else:
            # If no record exists for this user and adventure, create a new one
            leaderboard_table.put_item(Item=new_item)
        
        return {
            'statusCode': 200,
            'headers': get_cors_headers(),
            'body': json.dumps({'message': 'Score updated successfully'})
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': get_cors_headers(),
            'body': json.dumps({'error': str(e)})
        }
    response = users_table.get_item(Key={'username': username})
    if 'Item' not in response:
        return {
            'statusCode': 401,
            'headers': get_cors_headers(),
            'body': json.dumps({'error': 'Invalid username or password'})
        }
    
    user = response['Item']
    
    # Check password
    if verify_password(user['password'], password):
        return {
            'statusCode': 200,
            'headers': get_cors_headers(),
            'body': json.dumps({'message': 'Login successful'})
        }
    else:
        return {
            'statusCode': 401,
            'headers': get_cors_headers(),
            'body': json.dumps({'error': 'Invalid username or password'})
        }