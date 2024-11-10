// src/graphql/operations/subscriptions.ts
import { generateClient } from 'aws-amplify/api';
import { GraphQLSubscription } from '@aws-amplify/api';

const client = generateClient();

export interface GameSessionData {
  id: string;
  hostId: string;
  guestId?: string;
  adventureId: string;
  currentQuestionIndex: number;
  hostScore: number;
  guestScore: number;
  status: string;
  questions: {
    id: string;
    question: string;
    options: string[];
    correctAnswer: string;
  }[];
  questionScores: {
    questionIndex: number;
    hostScore: number;
    guestScore: number;
  }[];
  lastUpdateTimestamp: number;
  updatedAt: string;
}

export interface OnUpdateGameSessionSubscription {
  onUpdateGameSession: GameSessionData;
}

export const onUpdateGameSession = (sessionId: string) => {
  const subscription = /* GraphQL */ `
    subscription OnUpdateGameSession($id: ID!) {
      onUpdateGameSession(id: $id) {
        id
        hostId
        guestId
        adventureId
        currentQuestionIndex
        hostScore
        guestScore
        status
        questions {
          id
          question
          options
          correctAnswer
        }
        questionScores {
          questionIndex
          hostScore
          guestScore
        }
        lastUpdateTimestamp
        updatedAt
      }
    }
  `;

  return client.graphql<GraphQLSubscription<OnUpdateGameSessionSubscription>>({
    query: subscription,
    variables: { id: sessionId }
  });
};


// TypeScript interfaces
interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
}

interface QuestionScore {
  questionIndex: number;
  hostScore: number;
  guestScore: number;
}

export interface GameSessionSubscription {
  id: string;
  hostId: string;
  guestId?: string;
  adventureId: string;
  currentQuestionIndex: number;
  hostScore: number;
  guestScore: number;
  status: string;
  questions: Question[];
  questionScores: QuestionScore[];
  lastUpdateTimestamp: number;
  updatedAt: string;
}

// For game start notifications
export const onGameSessionStarted = (sessionId: string) => {
  const subscription = /* GraphQL */ `
    subscription OnGameSessionStarted($id: ID!) {
      onGameSessionStarted(id: $id) {
        id
        status
        currentQuestionIndex
        lastUpdateTimestamp
        updatedAt
      }
    }
  `;

  return client.graphql({
    query: subscription,
    variables: { id: sessionId }
  });
};

// For player join notifications
export const onPlayerJoined = (sessionId: string) => {
  const subscription = /* GraphQL */ `
    subscription OnPlayerJoined($id: ID!) {
      onPlayerJoined(id: $id) {
        id
        hostId
        guestId
        status
        updatedAt
      }
    }
  `;

  return client.graphql({
    query: subscription,
    variables: { id: sessionId }
  });
};
