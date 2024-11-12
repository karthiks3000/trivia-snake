import { ApiGatewayManagementApiClient, PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { 
  DynamoDBDocumentClient, 
  DeleteCommand,
  QueryCommand
} from '@aws-sdk/lib-dynamodb';

export interface GameSession {
  sessionId: string;
  hostId: string;
  adventureId: string;
  sessionStatus: string;
  currentQuestionIndex: number;
  startTime: number;
  players: Array<{
    userId: string;
    username: string;
    connectionId: string;
    score: number;
    ready: boolean;
    answered: boolean;
  }>;
  questionTimeLimit: number;
  ttl: number;
  questions: any[];
}

export function generateSessionId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export async function broadcastToSession(
  sessionId: string,
  message: any,
  domainName: string,
  stage: string
): Promise<void> {
  const ddbClient = new DynamoDBClient({});
  const dynamoDB = DynamoDBDocumentClient.from(ddbClient);
  
  const apiGwManagementApi = new ApiGatewayManagementApiClient({
    endpoint: `https://${domainName}/${stage}`
  });

  // Use Query instead of GetItem to find the session with any status
  const session = await dynamoDB.send(new QueryCommand({
    TableName: process.env.GAME_SESSIONS_TABLE_NAME!,
    KeyConditionExpression: 'sessionId = :sessionId',
    ExpressionAttributeValues: {
      ':sessionId': sessionId
    }
  }));

  if (!session.Items || session.Items.length === 0) {
    console.error('Session not found:', sessionId);
    return;
  }

  // Use the first (and should be only) item
  const sessionItem = session.Items[0];

  const sendPromises = sessionItem.players.map(async (player: any) => {
    try {
      await apiGwManagementApi.send(new PostToConnectionCommand({
        ConnectionId: player.connectionId,
        Data: Buffer.from(JSON.stringify(message))
      }));
    } catch (error: any) {
      if (error.statusCode === 410) {
        // Remove stale connections
        await dynamoDB.send(new DeleteCommand({
          TableName: process.env.CONNECTION_TABLE_NAME!,
          Key: { connectionId: player.connectionId }
        }));
      }
    }
  });

  await Promise.allSettled(sendPromises);
}
