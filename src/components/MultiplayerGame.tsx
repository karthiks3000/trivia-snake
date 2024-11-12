// components/MultiplayerGame.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWebSocket } from '../hooks/useWebSocket';
import { UserProfile } from '../App';
import Grid from './Grid';
import { Adventure } from './AdventureSelection';

interface MultiplayerGameProps {
    userProfile: UserProfile;
    adventure: Adventure;
    sessionId: string;
    initialQuestionIndex: number;
    timeLimit: number;
  }
  
  const MultiplayerGame: React.FC<MultiplayerGameProps> = ({
    userProfile,
    adventure,
    sessionId,
    initialQuestionIndex,
    timeLimit
  }) => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(initialQuestionIndex);
    const [score, setScore] = useState(0);
    const [elapsedTime, setElapsedTime] = useState(0);
    const { lastMessage, sendMessage } = useWebSocket();
    const navigate = useNavigate();
  

  // Timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Handle WebSocket messages
  useEffect(() => {
    if (lastMessage) {
      try {
        const data = JSON.parse(typeof lastMessage === 'string' ? lastMessage : JSON.stringify(lastMessage));
        console.log('Game received message:', data);

        switch (data.action) {
          case 'nextQuestion':
            setCurrentQuestionIndex(data.questionIndex);
            setElapsedTime(0);
            break;

          case 'gameOver':
            navigate('/game/multiplayer/results', {
              state: {
                sessionId: sessionId,
                finalScores: data.scores
              }
            });
            break;
        }
      } catch (error) {
        console.error('Error parsing game message:', error);
      }
    }
  }, [lastMessage, navigate, sessionId]);

  const handleCorrectAnswer = async () => {
    try {
      await sendMessage({
        action: 'submitAnswer',
        sessionId: sessionId,
        userId: userProfile.userId,
        correct: true,
        timeElapsed: elapsedTime
      });
      setScore(prev => prev + Math.max(100 - elapsedTime * 2, 10));
    } catch (error) {
      console.error('Error submitting correct answer:', error);
    }
  };

  const handleWrongAnswer = async () => {
    try {
      await sendMessage({
        action: 'submitAnswer',
        sessionId: sessionId,
        userId: userProfile.userId,
        correct: false,
        timeElapsed: elapsedTime
      });
    } catch (error) {
      console.error('Error submitting wrong answer:', error);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      sendMessage({
        action: 'leaveGame',
        sessionId: sessionId,
        userId: userProfile.userId
      }).catch(console.error);
    };
  }, []);

  const currentQuestion = adventure.questions[currentQuestionIndex];

  if (!currentQuestion) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-4 flex justify-between items-center">
          <div className="text-xl font-bold">Score: {score}</div>
          <div className="text-xl font-bold">Time: {elapsedTime}s</div>
        </div>

        <div className="mb-6 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4">
            {currentQuestion.question}
          </h2>
        </div>

        <div className="aspect-square">
          <Grid
            options={currentQuestion.options}
            correctAnswer={currentQuestion.correctAnswer}
            onCorrectAnswer={handleCorrectAnswer}
            onWrongAnswer={handleWrongAnswer}
            elapsedTime={elapsedTime}
          />
        </div>
      </div>
    </div>
  );
};

export default MultiplayerGame;
