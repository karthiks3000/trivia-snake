const AWS = require('aws-sdk');
const dynamoDB = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event, context) => {
  const questions = [
    {
      id: '1',
      question: 'What is the capital of France?',
      options: ['London', 'Berlin', 'Paris', 'Madrid'],
      correctAnswer: 'Paris',
    },
    {
      id: '2',
      question: 'Which planet is known as the Red Planet?',
      options: ['Venus', 'Mars', 'Jupiter', 'Saturn'],
      correctAnswer: 'Mars',
    },
    {
      id: '3',
      question: 'What is the largest mammal in the world?',
      options: ['African Elephant', 'Blue Whale', 'Giraffe', 'Hippopotamus'],
      correctAnswer: 'Blue Whale',
    },
    {
      id: '4',
      question: 'Who painted the Mona Lisa?',
      options: ['Vincent van Gogh', 'Pablo Picasso', 'Leonardo da Vinci', 'Michelangelo'],
      correctAnswer: 'Leonardo da Vinci',
    },
    {
      id: '5',
      question: 'What is the chemical symbol for gold?',
      options: ['Au', 'Ag', 'Fe', 'Cu'],
      correctAnswer: 'Au',
    },
  ];

  for (const question of questions) {
    const params = {
      TableName: process.env.QUESTIONS_TABLE,
      Item: question,
    };

    await dynamoDB.put(params).promise();
  }

  return {
    statusCode: 200,
    body: JSON.stringify('Questions populated successfully'),
  };
};