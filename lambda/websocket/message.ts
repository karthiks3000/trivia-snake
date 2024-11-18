import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { 
  DynamoDBDocumentClient, 
  GetCommand, 
  PutCommand, 
  UpdateCommand,
  QueryCommand
} from '@aws-sdk/lib-dynamodb';
import { GameSession, generateSessionId, broadcastToSession } from './utils';

const ddbClient = new DynamoDBClient({});
const dynamoDB = DynamoDBDocumentClient.from(ddbClient);
const CONNECTION_TABLE = process.env.CONNECTION_TABLE_NAME!;
const GAME_SESSIONS_TABLE = process.env.GAME_SESSIONS_TABLE_NAME!;
const PLAYER_RESPONSES_TABLE = process.env.PLAYER_RESPONSES_TABLE_NAME!;

export const handler = async (event: any) => {
  const connectionId = event.requestContext.connectionId;
  const { domainName, stage } = event.requestContext;

  try {
    const body = JSON.parse(event.body);
    const { action } = body;

    switch (action) {
      case 'createSession':
        return handleCreateSession(connectionId, body);
      case 'joinSession':
        return handleJoinSession(connectionId, body, domainName, stage);
      case 'startGame':
        return handleStartGame(connectionId, body, domainName, stage);
      case 'submitAnswer':
        return handleSubmitAnswer(body, domainName, stage);
      case 'checkQuestionState':
        return checkQuestionState(body, domainName, stage);
      default:
        return { statusCode: 400, body: 'Invalid action' };
    }
  } catch (error) {
    console.error('Error handling message:', error);
    return { statusCode: 500, body: 'Internal server error' };
  }
};

async function handleCreateSession(connectionId: string, body: any) {
  const { userId, username, adventureId, questions } = body;

  const sessionId = generateSessionId();

  const session: GameSession = {
    sessionId,
    hostId: userId,
    adventureId,
    sessionStatus: 'WAITING',
    currentQuestionIndex: 0,
    startTime: Date.now(),
    players: [{
      userId,
      username,
      connectionId,
      score: 0,
      ready: true
    }],
    questionTimeLimit: 30,
    ttl: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
    questions
  };

  await dynamoDB.send(new PutCommand({
    TableName: GAME_SESSIONS_TABLE,
    Item: session
  }));

  await dynamoDB.send(new UpdateCommand({
    TableName: CONNECTION_TABLE,
    Key: { connectionId },
    UpdateExpression: 'SET sessionId = :sessionId',
    ExpressionAttributeValues: {
      ':sessionId': sessionId
    }
  }));

  return {
    statusCode: 200,
    body: JSON.stringify({ sessionId })
  };
}


async function handleJoinSession(connectionId: string, body: any, domainName: string, stage: string) {
  const { sessionId, userId, username } = body;

  const session = await dynamoDB.send(new GetCommand({
    TableName: GAME_SESSIONS_TABLE,
    Key: { sessionId }
  }));

  if (!session.Item || session.Item.sessionStatus !== 'WAITING') {
    return {
      statusCode: 400,
      body: 'Invalid session or game already started'
    };
  }

  const updatedPlayers = [
    ...session.Item.players,
    {
      userId,
      username,
      connectionId,
      score: 0,
      ready: true
    }
  ];

  await dynamoDB.send(new UpdateCommand({
    TableName: GAME_SESSIONS_TABLE,
    Key: { sessionId },
    UpdateExpression: 'SET players = :players',
    ExpressionAttributeValues: {
      ':players': updatedPlayers
    }
  }));

  await dynamoDB.send(new UpdateCommand({
    TableName: CONNECTION_TABLE,
    Key: { connectionId },
    UpdateExpression: 'SET sessionId = :sessionId',
    ExpressionAttributeValues: {
      ':sessionId': sessionId
    }
  }));

  await broadcastToSession(
    sessionId,
    {
      sessionId: sessionId,
      action: 'playerJoined',
      players: updatedPlayers
    },
    domainName,
    stage
  );

  return {
    statusCode: 200,
    body: JSON.stringify({ sessionId })
  };
}

async function handleStartGame(connectionId: string, body: any, domainName: string, stage: string) {
  const { sessionId } = body;

  const session = await dynamoDB.send(new GetCommand({
    TableName: GAME_SESSIONS_TABLE,
    Key: { sessionId }
  }));

  if (!session.Item || 
      session.Item.sessionStatus !== 'WAITING' || 
      !session.Item.players.every((p: { ready: any; }) => p.ready) ||
      session.Item.hostId !== session.Item.players.find((p: { connectionId: string; }) => p.connectionId === connectionId)?.userId) { // Add host check
    return {
      statusCode: 400,
      body: JSON.stringify({error: 'Cannot start game'})
    };
  }

  await dynamoDB.send(new UpdateCommand({
    TableName: GAME_SESSIONS_TABLE,
    Key: { sessionId },
    UpdateExpression: 'SET sessionStatus = :sessionStatus, startTime = :startTime',
    ExpressionAttributeValues: {
      ':sessionStatus': 'IN_PROGRESS',
      ':startTime': Date.now()
    }
  }));

  await broadcastToSession(
    sessionId,
    {
      sessionId: sessionId,
      action: 'gameStarted',
      questionIndex: 0,
      timeLimit: session.Item.questionTimeLimit // Fixed to use questionTimeLimit instead of timeLimit
    },
    domainName,
    stage
  );

  // Start the first question timer
  setTimeout(async () => {
    await handleQuestionTimeout(sessionId, 0, domainName, stage);
  }, session.Item.questionTimeLimit * 1000); // Fixed to use questionTimeLimit

  return {
    statusCode: 200,
    body: JSON.stringify({ sessionId })
  };
}


async function handleSubmitAnswer(body: any, domainName: string, stage: string) {
  const { sessionId, correct, userId, questionId, timeElapsed } = body;

  try {
    // Check if the player already has a record
    const existingResponse = await dynamoDB.send(new GetCommand({
      TableName: PLAYER_RESPONSES_TABLE,
      Key: { sessionId, userId }
    }));

    if (existingResponse.Item) {
      // Player has answered previous questions - check if this question was already answered
      if (existingResponse.Item.responses && existingResponse.Item.responses[questionId]) {
        return {
          statusCode: 409,
          body: JSON.stringify({ error: 'Answer already submitted for this question' })
        };
      }

      // Get existing responses and score
      const currentScore = existingResponse.Item.score || 0;
      const currentResponses = existingResponse.Item.responses || {};
      // Create new complete item
      const updatedItem = {
        sessionId,
        userId,
        score: correct ? currentScore + 1 : currentScore,
        responses: {
          ...currentResponses,
          [questionId]: {
            correct,
            answered: true,
            timeElapsed
          }
        }
      };

      // Update the entire item
      await dynamoDB.send(new PutCommand({
        TableName: PLAYER_RESPONSES_TABLE,
        Item: updatedItem
      }));

    } else {
      // First answer from this player - create new record
      await dynamoDB.send(new PutCommand({
        TableName: PLAYER_RESPONSES_TABLE,
        Item: {
          sessionId,
          userId,
          score: correct ? 1 : 0,
          responses: {
            [questionId]: {
              correct,
              answered: true,
              timeElapsed
            }
          }
        }
      }));
    }

    const newScore = correct ? 
      (existingResponse?.Item?.score || 0) + 1 : 
      (existingResponse?.Item?.score || 0);

    // Update score in game session
    const gameSession = await dynamoDB.send(new GetCommand({
      TableName: GAME_SESSIONS_TABLE,
      Key: { sessionId }
    }));

    if (gameSession.Item) {
      const updatedPlayers = gameSession.Item.players.map((player: any) => {
        if (player.userId === userId) {
          return { ...player, score: newScore };
        }
        return player;
      });

      await dynamoDB.send(new PutCommand({
        TableName: GAME_SESSIONS_TABLE,
        Item: {
          ...gameSession.Item,
          players: updatedPlayers
        }
      }));

      // Broadcast the update to all players
      await broadcastToSession(
        sessionId,
        {
          sessionId: sessionId,
          action: 'playerAnswered',
          userId: userId,
          score: newScore,
          players: updatedPlayers
        },
        domainName,
        stage
      );

      return {
        statusCode: 200,
        body: JSON.stringify({ 
          sessionId,
          score: newScore,
          players: updatedPlayers
        })
      };
    } else {
      return {
        statusCode: 409,
        body: JSON.stringify({ error: 'Player game session not found' })
      };
    }

  } catch (error: any) {
    console.error('Error in handleSubmitAnswer:', error);
    throw error;
  }
}


async function checkQuestionState(body: any, domainName: string, stage: string) {
  const { sessionId, questionId } = body;

  // Get the current session state
  const session = await dynamoDB.send(new GetCommand({
    TableName: GAME_SESSIONS_TABLE,
    Key: { sessionId },
  }));

  if (!session.Item || session.Item.sessionStatus !== 'IN_PROGRESS') {
    return {
      statusCode: 200,
      body: JSON.stringify({ sessionId, allAnswered: true })
    };
  }
  try {
    // Get all player responses for this session
    const playerResponses = await dynamoDB.send(new QueryCommand({
      TableName: PLAYER_RESPONSES_TABLE,
      KeyConditionExpression: 'sessionId = :sessionId',
      ExpressionAttributeValues: {
        ':sessionId': session.Item.sessionId
      }
    }));

    // Check if all players have answered the current question
    const allAnswered = session.Item.players.every((player: any) => {
      const playerResponse = playerResponses.Items?.find((item: any) => item.userId === player.userId);
      player.score = playerResponse?.score ?? 0;
      return playerResponse?.responses?.[questionId]?.answered ?? false;
    });

    if (allAnswered) {
      await handleQuestionComplete(session.Item as GameSession, domainName, stage);
    }
    return {
      statusCode: 200,
      body: JSON.stringify({
        sessionId,
        allAnswered,
        players: session.Item.players
      })
    };
  } catch (error: any) {
    console.error('Error in checkAllPlayersAnswered:', error);
    throw error;
  }
}


async function handleQuestionTimeout(
  sessionId: string,
  questionIndex: number,
  domainName: string,
  stage: string
) {
  const session = await dynamoDB.send(new GetCommand({
    TableName: GAME_SESSIONS_TABLE,
    Key: { sessionId }
  }));

  if (!session.Item || 
      session.Item.sessionStatus !== 'IN_PROGRESS' || 
      session.Item.currentQuestionIndex !== questionIndex) {
    return;
  }

  await handleQuestionComplete(session.Item as GameSession, domainName, stage);
}

async function handleQuestionComplete(
  session: GameSession,
  domainName: string,
  stage: string
) {
  const isLastQuestion = session.currentQuestionIndex === session.questions.length - 1;
  
  if (isLastQuestion) {
    await dynamoDB.send(new UpdateCommand({
      TableName: GAME_SESSIONS_TABLE,
      Key: { 'sessionId': session.sessionId},
      UpdateExpression: 'SET sessionStatus = :sessionStatus',
      ExpressionAttributeValues: {
        ':sessionStatus': 'COMPLETED'
      }
    }));

    await broadcastToSession(
      session.sessionId,
      {
        session: session.sessionId,
        action: 'gameComplete',
        players: session.players
      },
      domainName,
      stage
    );
  } else {
    const nextQuestionIndex = session.currentQuestionIndex + 1;
    
    await dynamoDB.send(new UpdateCommand({
      TableName: GAME_SESSIONS_TABLE,
      Key: { 'sessionId': session.sessionId },
      UpdateExpression: 'SET currentQuestionIndex = :nextIndex, players = :players',
      ExpressionAttributeValues: {
        ':nextIndex': nextQuestionIndex,
        ':players': session.players.map(p => ({ ...p, answered: false }))
      }
    }));

    await broadcastToSession(
      session.sessionId,
      {
        sessionId: session.sessionId,
        action: 'nextQuestion',
        questionIndex: nextQuestionIndex,
        timeLimit: session.questionTimeLimit
      },
      domainName,
      stage
    );

    // Start the next question timer
    setTimeout(async () => {
      await handleQuestionTimeout(session.sessionId, nextQuestionIndex, domainName, stage);
    }, session.questionTimeLimit * 1000);
  }
}
