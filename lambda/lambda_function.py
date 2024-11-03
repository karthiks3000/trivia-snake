# lambda_function.py

import base64
from decimal import Decimal
import json
import boto3
from boto3.dynamodb.conditions import Key
import os
import hashlib


dynamodb = boto3.resource('dynamodb')
users_table_name = os.environ['USERS_TABLE_NAME']
leaderboard_table_name = os.environ['LEADERBOARD_TABLE_NAME']
# Create the table objects
users_table = dynamodb.Table(users_table_name)
leaderboard_table = dynamodb.Table(leaderboard_table_name)


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
    elif path == '/register':
        if http_method == 'POST':
            return register_user(json.loads(event['body']))
    elif path == '/login':
        if http_method == 'POST':
            return login_user(json.loads(event['body']))
    
    return {
        'statusCode': 400,
        'headers': get_cors_headers(),
        'body': json.dumps({'error': 'Unsupported HTTP method or path'})
    }

def hash_password(password):
    # Use a unique salt for each user
    salt = os.urandom(32)
    hashed = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100000)
    # Combine salt and hash, and convert to base64 for storage
    return base64.b64encode(salt + hashed).decode('utf-8')

def verify_password(stored_password, provided_password):
    # Decode the stored password from base64
    decoded = base64.b64decode(stored_password.encode('utf-8'))
    salt = decoded[:32]  # 32 is the length of the salt
    stored_hashed = decoded[32:]
    # Hash the provided password with the same salt
    hashed = hashlib.pbkdf2_hmac('sha256', provided_password.encode('utf-8'), salt, 100000)
    return hashed == stored_hashed

def get_cors_headers():
    return {
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
    }

def get_leaderboard():
    try:
        response = leaderboard_table.scan()
        items = response['Items']
        # Sort the items, but don't limit to 10 yet
        sorted_items = sorted(items, key=lambda x: (-x['score'], x['time']))
        
        # Get the top scores (up to 10)
        top_scores = sorted_items[:10] if len(sorted_items) > 10 else sorted_items
        
        return {
            'statusCode': 200,
            'headers': get_cors_headers(),
            'body': json.dumps(top_scores, cls=DecimalEncoder)
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': get_cors_headers(),
            'body': json.dumps({'error': f'Error fetching leaderboard: {str(e)}'})
        }

def save_score(body):
    username = body.get('username')
    score = body.get('score')
    time = body.get('time')
    
    if not username or score is None or time is None:
        return {
            'statusCode': 400,
            'headers': get_cors_headers(),
            'body': json.dumps({'error': 'Username, score, and time are required'})
        }
    
    try:
        # Get the current record for the user
        response = leaderboard_table.get_item(Key={'username': username})
        new_item = {
            'username': username,
            'score': Decimal(str(score)),  # Convert to Decimal for DynamoDB
            'time': Decimal(str(time))  # Convert to Decimal for DynamoDB
        }
        
        if 'Item' in response:
            current_record = response['Item']
            # Update only if the new score is higher or if the scores are equal and the new time is lower
            if score > current_record['score'] or (score == current_record['score'] and time < current_record['time']):
                leaderboard_table.put_item(Item=new_item)
        else:
            # If no record exists, create a new one
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
    
def register_user(body):
    username = body.get('username')
    password = body.get('password')
    
    if not username or not password:
        return {
            'statusCode': 400,
            'headers': get_cors_headers(),
            'body': json.dumps({'error': 'Username and password are required'})
        }
    
    # Check if username already exists
    response = users_table.get_item(Key={'username': username})
    if 'Item' in response:
        return {
            'statusCode': 400,
            'headers': get_cors_headers(),
            'body': json.dumps({'error': 'Username already exists'})
        }
    
    # Hash the password
    hashed_password = hash_password(password)
    
    # Store the new user
    users_table.put_item(Item={
        'username': username,
        'password': hashed_password
    })
    
    return {
        'statusCode': 200,
        'headers': get_cors_headers(),
        'body': json.dumps({'message': 'User registered successfully'})
    }

def login_user(body):
    username = body.get('username')
    password = body.get('password')
    
    if not username or not password:
        return {
            'statusCode': 400,
            'headers': get_cors_headers(),
            'body': json.dumps({'error': 'Username and password are required'})
        }
    
    # Retrieve user from database
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