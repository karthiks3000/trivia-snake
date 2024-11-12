import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { 
  DynamoDBDocumentClient, 
  GetCommand, 
  PutCommand, 
  UpdateCommand 
} from '@aws-sdk/lib-dynamodb';
import { GameSession, generateSessionId, broadcastToSession } from './utils';

const ddbClient = new DynamoDBClient({});
const dynamoDB = DynamoDBDocumentClient.from(ddbClient);
const CONNECTION_TABLE = process.env.CONNECTION_TABLE_NAME!;
const GAME_SESSIONS_TABLE = process.env.GAME_SESSIONS_TABLE_NAME!;

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
      case 'toggleReady':
        return handleToggleReady(connectionId, body, domainName, stage);
      case 'startGame':
        return handleStartGame(connectionId, body, domainName, stage);
      case 'submitAnswer':
        return handleSubmitAnswer(connectionId, body, domainName, stage);
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
      ready: true,
      answered: false
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
      ready: true,
      answered: false
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

async function handleToggleReady(connectionId: string, body: any, domainName: string, stage: string) {
  const { sessionId } = body;

  const session = await dynamoDB.send(new GetCommand({
    TableName: GAME_SESSIONS_TABLE,
    Key: { sessionId }
  }));

  if (!session.Item) {
    return {
      statusCode: 400,
      body: 'Invalid session'
    };
  }

  const updatedPlayers = session.Item.players.map((player: { connectionId: string; ready: any; }) =>
    player.connectionId === connectionId
      ? { ...player, ready: !player.ready }
      : player
  );

  await dynamoDB.send(new UpdateCommand({
    TableName: GAME_SESSIONS_TABLE,
    Key: { sessionId },
    UpdateExpression: 'SET players = :players',
    ExpressionAttributeValues: {
      ':players': updatedPlayers
    }
  }));

  await broadcastToSession(
    sessionId,
    {
      action: 'playerReady',
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


async function handleSubmitAnswer(connectionId: string, body: any, domainName: string, stage: string) {
  const { sessionId, correct, userId } = body;

  console.log('Connection ID = ' + connectionId);

  const session = await dynamoDB.send(new GetCommand({
    TableName: GAME_SESSIONS_TABLE,
    Key: { sessionId },
  }));

  console.log('session = ' + session.Item);


  if (!session.Item || session.Item.sessionStatus !== 'IN_PROGRESS') {
    return {
      statusCode: 400,
      body: JSON.stringify({error: 'Invalid session or game not in progress'})
    };
  }

  const playerIndex = session.Item.players.findIndex(
    (    p: { userId: string; }) => p.userId === userId
  );

  if (playerIndex === -1 || session.Item.players[playerIndex].answered) {
    return {
      statusCode: 400,
      body: JSON.stringify({error: 'Invalid player or already answered'})
    };
  }

  const updatedPlayers = session.Item.players.map((player: { userId: string; score: number; }) =>
    player.userId === userId
      ? {
          ...player,
          score: correct ? (player.score || 0) + 1 : (player.score || 0),
          answered: true
        }
      : player
  );

  await dynamoDB.send(new UpdateCommand({
    TableName: GAME_SESSIONS_TABLE,
    Key: { sessionId },
    UpdateExpression: 'SET players = :players',
    ExpressionAttributeValues: {
      ':players': updatedPlayers
    }
  }));

  // await broadcastToSession(
  //   sessionId,
  //   {
  //     action: 'playerAnswered',
  //     userId: session.Item.players[playerIndex].userId,
  //     score: scoreIncrement,
  //     players: updatedPlayers
  //   },
  //   domainName,
  //   stage
  // );

  // Check if all players have answered
  if (updatedPlayers.every((p: { answered: any; }) => p.answered)) {
    await handleQuestionComplete(session.Item as GameSession, domainName, stage);
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ sessionId })
  };
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
