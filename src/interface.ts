export interface UserProfile {
  userId: string,
  username: string
}

export interface GameSession {
    id: string;
    hostId: string;
    guestId?: string;
    adventureId: string;
    currentQuestionIndex: number;
    hostScore: number;
    guestScore: number;
    sessionStatus: string;
    questions: Question[];
    questionScores: QuestionScore[];
    lastUpdateTimestamp: number;
    createdAt: string;
    updatedAt: string;
  }

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

  export interface GameSessionSubscription {
    id: string;
    hostId: string;
    guestId?: string;
    adventureId: string;
    currentQuestionIndex: number;
    hostScore: number;
    guestScore: number;
    sessionStatus: string;
    questions: Question[];
    questionScores: QuestionScore[];
    lastUpdateTimestamp: number;
    updatedAt: string;
  }

  export interface Adventure {
    id?: string;
    name: string;
    description: string;
    image_url: string;
    questions: Question[];
    createdBy?: string;
    verificationStatus?: string;
    genre: string;
  }
  