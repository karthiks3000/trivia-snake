// src/graphql/operations/queries.ts
import { generateClient, GraphQLQuery } from 'aws-amplify/api';

const client = generateClient();

// Define the response type for getGameSession
export interface GetGameSessionQuery {
  getGameSession: {
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
    createdAt: string;
    updatedAt: string;
  };
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


export const listGameSessions = () => {
  const query = /* GraphQL */ `
    query ListGameSessions {
      listGameSessions {
        items {
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
          createdAt
          updatedAt
        }
        nextToken
      }
    }
  `;

  return client.graphql<GraphQLQuery<ListGameSessionsQuery>>({
    query
  });
};

export const getAdventure = (adventureId: string) => {
  const query = /* GraphQL */ `
    query GetAdventure($id: ID!) {
      getAdventure(id: $id) {
        id
        title
        description
        questions {
          id
          question
          options
          correctAnswer
        }
        createdAt
        updatedAt
      }
    }
  `;

  return client.graphql<GraphQLQuery<GetAdventureQuery>>({
    query,
    variables: { id: adventureId }
  });
};

export const listAdventures = () => {
  const query = /* GraphQL */ `
    query ListAdventures {
      listAdventures {
        items {
          id
          title
          description
          questions {
            id
            question
            options
            correctAnswer
          }
          createdAt
          updatedAt
        }
        nextToken
      }
    }
  `;

  return client.graphql<GraphQLQuery<{
    listAdventures: {
      items: Adventure[];
      nextToken?: string;
    };
  }>>({
    query
  });
};

// TypeScript interfaces
export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
}

export interface QuestionScore {
  questionIndex: number;
  hostScore: number;
  guestScore: number;
}

export interface GameSession {
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
  createdAt: string;
  updatedAt: string;
}

export interface Adventure {
  id: string;
  title: string;
  description: string;
  questions: Question[];
  createdAt: string;
  updatedAt: string;
}


export interface ListGameSessionsQuery {
  listGameSessions: {
    items: GameSession[];
    nextToken?: string;
  };
}

export interface GetAdventureQuery {
  getAdventure: Adventure;
}

export interface ListGameSessionsResponse {
  listGameSessions: {
    items: GameSession[];
    nextToken?: string;
  };
}

export interface ListAdventuresQuery {
  listAdventures: {
    items: Adventure[];
    nextToken?: string;
  };
}

export interface ListAdventuresResponse {
  listAdventures: {
    items: Adventure[];
    nextToken?: string;
  };
}
