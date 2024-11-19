export interface Player {
    userId: string;
    username: string;
    ready: boolean;
    connectionId: string;
    score: number;
    answered: boolean;
  }

  export interface WebSocketResponse {
    action: 'playerJoined' | 'playerLeft' | 'playerReady' | 'gameStarted';
    players?: Player[];
    userId?: string;
    sessionId?: string;
    questionIndex?: number;
    timeLimit?: number;
    newHostId?: string;
  }

  export interface WebSocketMessage {
    action: string;
    [key: string]: any;
  }

  export interface CreateSessionResponse {
    sessionId: string;
  }
  
  export interface JoinSessionResponse {
    sessionId: string;
  }

  export interface Connection {
    connectionId: string;
    sessionId?: string;
    userId: string;
    username: string;
    timestamp: number;
    ttl: number;
  }
  
  export interface Question {
    question: string;
    options: string[];
    correctAnswer: string;
  }
  
  export interface GameSession {
    sessionId: string;
    hostId: string;
    adventureId: string;
    sessionStatus: 'WAITING' | 'IN_PROGRESS' | 'COMPLETED';
    currentQuestionIndex: number;
    startTime: number;
    players: {
      userId: string;
      username: string;
      connectionId: string;
      score: number;
      ready: boolean;
      answered: boolean;
    }[];
    questionTimeLimit: number; // Time limit per question in seconds
    ttl: number; // DynamoDB TTL timestamp for auto-deletion
    questions: Question[];
  }