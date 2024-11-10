// src/graphql/operations/mutations.ts
import { generateClient } from 'aws-amplify/api';
import { GraphQLQuery } from '@aws-amplify/api';

const client = generateClient();

export interface CreateGameSessionMutation {
  createGameSession: {
    id: string;
    hostId: string;
    adventureId: string;
    status: string;
    currentQuestionIndex: number;
    hostScore: number;
    guestScore: number;
    createdAt: string;
    updatedAt: string;
  };
}

export interface JoinGameSessionMutation {
  joinGameSession: {
    id: string;
    hostId: string;
    guestId: string;
    adventureId: string;
    status: string;
    currentQuestionIndex: number;
    hostScore: number;
    guestScore: number;
    createdAt: string;
    updatedAt: string;
  };
}

export interface StartGameSessionMutation {
  startGameSession: {
    id: string;
    status: string;
    currentQuestionIndex: number;
    updatedAt: string;
  };
}

export interface AnswerQuestionMutation {
  answerQuestion: {
    id: string;
    hostId: string;
    guestId?: string;
    currentQuestionIndex: number;
    hostScore: number;
    guestScore: number;
    status: string;
    updatedAt: string;
  };
}

export interface AnswerQuestionInput {
  sessionId: string;
  playerId: string;
  answer: string;
}

export const answerQuestion = (input: AnswerQuestionInput) => {
  const mutation = /* GraphQL */ `
    mutation AnswerQuestion($sessionId: ID!, $playerId: ID!, $answer: String!) {
      answerQuestion(sessionId: $sessionId, playerId: $playerId, answer: $answer) {
        id
        hostId
        guestId
        currentQuestionIndex
        hostScore
        guestScore
        status
        updatedAt
      }
    }
  `;

  return client.graphql<GraphQLQuery<AnswerQuestionMutation>>({
    query: mutation,
    variables: input
  });
};