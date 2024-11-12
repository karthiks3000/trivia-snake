// lambda/websocket/connect.ts
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

const ddbClient = new DynamoDBClient({});
const dynamoDB = DynamoDBDocumentClient.from(ddbClient);
const CONNECTION_TABLE = process.env.CONNECTION_TABLE_NAME!;

export const handler = async (event: any) => {
  console.log('Connect event:', JSON.stringify(event, null, 2));

  try {
    const connectionId = event.requestContext.connectionId;
    const { userId, username } = event.queryStringParameters || {};

    if (!connectionId) {
      console.error('No connectionId provided');
      return { 
        statusCode: 400, 
        body: 'connectionId is required' 
      };
    }

    if (!userId || !username) {
      console.error('Missing userId or username');
      return { 
        statusCode: 400, 
        body: 'userId and username are required query parameters' 
      };
    }

    const connection = {
      connectionId,
      userId,
      username,
      timestamp: Date.now(),
      ttl: Math.floor(Date.now() / 1000) + 24 * 60 * 60 // 24 hour TTL
    };

    await dynamoDB.send(new PutCommand({
      TableName: CONNECTION_TABLE,
      Item: connection
    }));

    console.log('Successfully connected:', connection);

    return { 
      statusCode: 200, 
      body: 'Connected' 
    };
  } catch (error) {
    console.error('Error in connect handler:', error);
    return { 
      statusCode: 500, 
      body: 'Internal server error' 
    };
  }
};
