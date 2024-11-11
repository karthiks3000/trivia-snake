// src/graphql/operations/queries.ts
import { GameSession } from '@/src/interface';
import { generateClient, GraphQLQuery } from 'aws-amplify/api';

const client = generateClient();

// Define the response type for getGameSession
export interface GetGameSessionQuery {
  getGameSession: GameSession
}

export const getGameSession = (sessionId: string) => {
  const query = /* GraphQL */ `
    query GetGameSession($id: ID!) {
      getGameSession(id: $id) {
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
        createdAt
        updatedAt
      }
    }
  `;

  return client.graphql<GraphQLQuery<GetGameSessionQuery>>({
    query,
    variables: { id: sessionId }
  });
};


export const ListGameSessions = /* GraphQL */ `
  query ListGameSessions($limit: Int, $nextToken: String) {
    listGameSessions(limit: $limit, nextToken: $nextToken) {
      items {
        id
        hostId
        adventureId
        sessionStatus
        currentQuestionIndex
        hostScore
        guestScore
        createdAt
        updatedAt
      }
      nextToken
    }
  }
`;

export interface ListGameSessionsQuery {
  listGameSessions: {
    items: GameSession[];
    nextToken: string | null;
  };
}

export interface ListGameSessionsResponse {
  listGameSessions: {
    items: GameSession[];
    nextToken: string | null;
  };
}
