import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, DeleteCommand, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { broadcastToSession } from './utils';

const ddbClient = new DynamoDBClient({});
const dynamoDB = DynamoDBDocumentClient.from(ddbClient);
const CONNECTION_TABLE = process.env.CONNECTION_TABLE_NAME!;
const GAME_SESSIONS_TABLE = process.env.GAME_SESSIONS_TABLE_NAME!;

export const handler = async (event: any) => {
  const connectionId = event.requestContext.connectionId;
  const { domainName, stage } = event.requestContext;

  try {
    // Get connection details
    const connection = await dynamoDB.send(new GetCommand({
      TableName: CONNECTION_TABLE,
      Key: { connectionId }
    }));

    if (connection.Item?.sessionId) {
      const sessionId = connection.Item.sessionId;
      
      // Get session details
      const session = await dynamoDB.send(new GetCommand({
        TableName: GAME_SESSIONS_TABLE,
        Key: { sessionId }
      }));

      if (session.Item) {
        const updatedPlayers = session.Item.players.filter(
          (          p: { connectionId: any; }) => p.connectionId !== connectionId
        );

        if (updatedPlayers.length === 0) {
          // Delete session if no players left
          await dynamoDB.send(new DeleteCommand({
            TableName: GAME_SESSIONS_TABLE,
            Key: { sessionId }
          }));
        } else {
          // Update session with remaining players
          await dynamoDB.send(new UpdateCommand({
            TableName: GAME_SESSIONS_TABLE,
            Key: { sessionId },
            UpdateExpression: 'SET players = :players',
            ExpressionAttributeValues: {
              ':players': updatedPlayers
            }
          }));

          // Notify remaining players
          await broadcastToSession(
            sessionId,
            {
              action: 'playerLeft',
              userId: connection.Item.userId
            },
            domainName,
            stage
          );
        }
      }
    }

    // Delete connection
    await dynamoDB.send(new DeleteCommand({
      TableName: CONNECTION_TABLE,
      Key: { connectionId }
    }));

    return { statusCode: 200, body: 'Disconnected' };
  } catch (error) {
    console.error('Error disconnecting:', error);
    return { statusCode: 500, body: 'Failed to disconnect' };
  }
};