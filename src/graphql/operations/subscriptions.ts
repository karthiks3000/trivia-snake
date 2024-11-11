// src/graphql/operations/subscriptions.ts
import { generateClient } from 'aws-amplify/api';
import { GraphQLSubscription } from '@aws-amplify/api';
import { GameSession } from '@/src/interface';

const client = generateClient();


export interface OnUpdateGameSessionSubscription {
  onUpdateGameSession: GameSession;
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
        sessionStatus
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


// For game start notifications
export const onGameSessionStarted = (sessionId: string) => {
  const subscription = /* GraphQL */ `
    subscription OnGameSessionStarted($id: ID!) {
      onGameSessionStarted(id: $id) {
        id
        sessionStatus
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
        sessionStatus
        updatedAt
      }
    }
  `;

  return client.graphql({
    query: subscription,
    variables: { id: sessionId }
  });
};
