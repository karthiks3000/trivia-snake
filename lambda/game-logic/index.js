const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { 
  DynamoDBDocumentClient, 
  PutCommand, 
  GetCommand, 
  UpdateCommand
} = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));  // Add logging

  // AppSync sends the field name in info.fieldName
  const fieldName = event.info.fieldName;
  const args = event.arguments;

  try {
    switch (fieldName) {
      case 'createGameSession':
        return await createGameSession(args.input);
      case 'joinGameSession':
        return await joinGameSession(args.input);
      case 'answerQuestion':
        return await answerQuestion(args.input);
      case 'startGameSession':
        return await startGameSession(args.sessionId);
      default:
        throw new Error(`Unhandled field: ${field}`);
    }
  } catch (error) {
    console.error('Error in handler:', error);
    throw error;
  }
};

async function getAdventureQuestions(adventureId) {
  const params = {
    TableName: process.env.ADVENTURES_TABLE,
    Key: { id: adventureId }
  };

  try {
    const result = await docClient.send(new GetCommand(params));
    if (!result.Item) {
      throw new Error(`Adventure not found with ID: ${adventureId}`);
    }
    
    const questions = result.Item.questions;
    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      throw new Error(`No questions found for adventure: ${adventureId}`);
    }

    // Shuffle the questions array
    return questions.sort(() => 0.5 - Math.random());
  } catch (error) {
    console.error('Error getting adventure questions:', error);
    throw error;
  }
}

async function createGameSession(input) {
  const { hostId, adventureId } = input;
  const sessionId = generateUniqueId();
  const timestamp = Date.now();

  // Get questions from the Adventure record
  const questions = await getAdventureQuestions(adventureId);

  const params = {
    TableName: process.env.GAME_SESSIONS_TABLE,
    Item: {
      id: sessionId,
      hostId,
      adventureId,
      currentQuestionIndex: 0,
      hostScore: 0,
      guestScore: 0,
      sessionStatus: 'WAITING_FOR_PLAYER',
      questions: questions,
      questionScores: [],
      lastUpdateTimestamp: timestamp,
      createdAt: new Date(timestamp).toISOString(),
      updatedAt: new Date(timestamp).toISOString(),
      ttl: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours from now
    }
  };

  try {
    await docClient.send(new PutCommand(params));
    return params.Item;
  } catch (error) {
    console.error('Error creating game session:', error);
    throw error;
  }
}

async function joinGameSession(input) {
  const { sessionId, guestId } = input;
  const timestamp = Date.now();

  const params = {
    TableName: process.env.GAME_SESSIONS_TABLE,
    Key: { id: sessionId },
    UpdateExpression: 'SET guestId = :guestId, sessionStatus = :sessionStatus, updatedAt = :updatedAt, lastUpdateTimestamp = :timestamp',
    ExpressionAttributeValues: {
      ':guestId': guestId,
      ':sessionStatus': 'IN_PROGRESS',
      ':updatedAt': new Date(timestamp).toISOString(),
      ':timestamp': timestamp
    },
    ReturnValues: 'ALL_NEW'
  };

  try {
    const result = await docClient.send(new UpdateCommand(params));
    return result.Attributes;
  } catch (error) {
    console.error('Error joining game session:', error);
    throw error;
  }
}

async function answerQuestion(input) {
  const { sessionId, playerId, answer, answerTime } = input;
  const session = await getGameSession(sessionId);

  if (!session) {
    throw new Error('Game session not found');
  }

  if (session.sessionStatus !== 'IN_PROGRESS') {
    throw new Error('Game session is not in progress');
  }

  const currentQuestion = session.questions[session.currentQuestionIndex];
  const isCorrect = answer === currentQuestion.correctAnswer;
  const score = calculateScore(answerTime - session.lastUpdateTimestamp);

  const updatedScores = {
    questionIndex: session.currentQuestionIndex,
    hostScore: playerId === session.hostId ? score : 0,
    guestScore: playerId === session.guestId ? score : 0,
    isCorrect
  };

  const params = {
    TableName: process.env.GAME_SESSIONS_TABLE,
    Key: { id: sessionId },
    UpdateExpression: 'SET currentQuestionIndex = currentQuestionIndex + :inc, questionScores = list_append(if_not_exists(questionScores, :empty_list), :scores), lastUpdateTimestamp = :timestamp, updatedAt = :updatedAt',
    ExpressionAttributeValues: {
      ':inc': 1,
      ':scores': [updatedScores],
      ':empty_list': [],
      ':timestamp': answerTime,
      ':updatedAt': new Date(answerTime).toISOString()
    },
    ReturnValues: 'ALL_NEW'
  };

  // Update player score
  if (playerId === session.hostId) {
    params.UpdateExpression += ', hostScore = hostScore + :score';
    params.ExpressionAttributeValues[':score'] = isCorrect ? score : 0;
  } else if (playerId === session.guestId) {
    params.UpdateExpression += ', guestScore = guestScore + :score';
    params.ExpressionAttributeValues[':score'] = isCorrect ? score : 0;
  }

  // Check if this was the last question
  if (session.currentQuestionIndex === session.questions.length - 1) {
    params.UpdateExpression += ', sessionStatus = :gameStatus';
    params.ExpressionAttributeValues[':gameStatus'] = 'COMPLETED';
  }

  try {
    const result = await docClient.send(new UpdateCommand(params));
    return result.Attributes;
  } catch (error) {
    console.error('Error updating answer:', error);
    throw error;
  }
}

async function startGameSession(sessionId) {
  const timestamp = Date.now();

  const params = {
    TableName: process.env.GAME_SESSIONS_TABLE,
    Key: { id: sessionId },
    UpdateExpression: 'SET sessionStatus = :sessionStatus, lastUpdateTimestamp = :timestamp, updatedAt = :updatedAt',
    ExpressionAttributeValues: {
      ':sessionStatus': 'IN_PROGRESS',
      ':timestamp': timestamp,
      ':updatedAt': new Date(timestamp).toISOString()
    },
    ReturnValues: 'ALL_NEW'
  };

  try {
    const result = await docClient.send(new UpdateCommand(params));
    return result.Attributes;
  } catch (error) {
    console.error('Error starting game session:', error);
    throw error;
  }
}

async function getGameSession(sessionId) {
  const params = {
    TableName: process.env.GAME_SESSIONS_TABLE,
    Key: { id: sessionId }
  };

  try {
    const result = await docClient.send(new GetCommand(params));
    return result.Item;
  } catch (error) {
    console.error('Error getting game session:', error);
    throw error;
  }
}

function generateUniqueId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function calculateScore(timeDifference) {
  // Base score is 1000
  // Subtract 100 points for each second taken to answer
  // Minimum score is 0
  const baseScore = 1000;
  const deductionPerSecond = 100;
  const secondsTaken = timeDifference / 1000;
  return Math.max(baseScore - (secondsTaken * deductionPerSecond), 0);
}
