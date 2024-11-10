import React, { useEffect, useState, useCallback } from 'react';
import { generateClient } from 'aws-amplify/api';
import { GraphQLQuery, GraphQLSubscription } from '@aws-amplify/api';
import { getGameSession, GetGameSessionQuery } from '../graphql/operations/queries';
import { answerQuestion } from '../graphql/operations/mutations';
import { GraphqlSubscriptionMessage } from '@aws-amplify/api-graphql';
import { GameSessionData, onUpdateGameSession } from '../graphql/operations/subscriptions';

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
}

interface GameSession extends GameSessionData {
  createdAt: string;
}

interface MultiplayerGameProps {
  sessionId: string;
  userProfile: {
    userId: string;
    isHost: boolean;
  };
}

const MultiplayerGame: React.FC<MultiplayerGameProps> = ({ sessionId, userProfile }) => {
  const [gameSession, setGameSession] = useState<GameSession | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [player2Score, setPlayer2Score] = useState(0);
  const [questionTimer, setQuestionTimer] = useState(10);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to game updates
  useEffect(() => {
    const sub = onUpdateGameSession(sessionId);
    
    const subscription = sub.subscribe({
      next: (message: GraphqlSubscriptionMessage<GraphQLSubscription<{ onUpdateGameSession: GameSessionData }>>) => {
        const updatedSession = message.data.onUpdateGameSession;
        setGameSession(prevSession => ({
          ...updatedSession,
          createdAt: prevSession?.createdAt || new Date().toISOString()
        }));
        setCurrentQuestionIndex(updatedSession.currentQuestionIndex);
        setScore(userProfile.isHost ? updatedSession.hostScore : updatedSession.guestScore);
        setPlayer2Score(userProfile.isHost ? updatedSession.guestScore : updatedSession.hostScore);
        setCurrentQuestion(updatedSession.questions[updatedSession.currentQuestionIndex]);

        if (updatedSession.status === 'COMPLETED') {
          setGameOver(true);
          setGameWon(userProfile.isHost ? 
            updatedSession.hostScore > updatedSession.guestScore : 
            updatedSession.guestScore > updatedSession.hostScore
          );
        }
      },
      error: (error: any) => {
        console.error('Subscription error:', error);
        setError('Lost connection to game updates');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [sessionId, userProfile.isHost]);

  // Fetch initial game session
  const fetchGameSession = useCallback(async () => {
    try {
      const { data } = await getGameSession(sessionId);
      if (data) {
        const session = data.getGameSession;
        setGameSession(session);
        setCurrentQuestionIndex(session.currentQuestionIndex);
        setScore(userProfile.isHost ? session.hostScore : session.guestScore);
        setPlayer2Score(userProfile.isHost ? session.guestScore : session.hostScore);
        setCurrentQuestion(session.questions[session.currentQuestionIndex]);
      }
    } catch (error) {
      console.error('Error fetching game session:', error);
      setError('Failed to load game session');
    } finally {
      setLoading(false);
    }
  }, [sessionId, userProfile.isHost]);

  // Initialize game
  useEffect(() => {
    fetchGameSession();
  }, [fetchGameSession]);

  // Question timer
  useEffect(() => {
    if (!gameOver && currentQuestion) {
      const timer = setInterval(() => {
        setQuestionTimer((prev) => {
          if (prev <= 1) {
            handleAnswer(''); // Submit empty answer when time runs out
            return 10;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [currentQuestion, gameOver]);

  const handleAnswer = useCallback(async (answer: string) => {
    try {
      await answerQuestion({
        sessionId,
        playerId: userProfile.userId,
        answer
      });
      setQuestionTimer(10);
    } catch (error) {
      console.error('Error submitting answer:', error);
      setError('Failed to submit answer');
    }
  }, [sessionId, userProfile.userId]);

  if (loading) {
    return <div>Loading game...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!gameSession || !currentQuestion) {
    return <div>Game session not found</div>;
  }

  if (gameOver) {
    return (
      <div className="game-over">
        <h2>{gameWon ? 'You Won!' : 'You Lost!'}</h2>
        <div className="final-scores">
          <p>Your Score: {score}</p>
          <p>Opponent's Score: {player2Score}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="multiplayer-game">
      <div className="game-header">
        <div className="scores">
          <p>Your Score: {score}</p>
          <p>Opponent's Score: {player2Score}</p>
        </div>
        <div className="timer">Time: {questionTimer}s</div>
      </div>

      <div className="question-container">
        <h3>Question {currentQuestionIndex + 1}</h3>
        <p>{currentQuestion.question}</p>
        
        <div className="options">
          {currentQuestion.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswer(option)}
              className="option-button"
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MultiplayerGame;
