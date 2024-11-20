import React, { useState, useEffect, useRef } from 'react';
import { UserProfile } from '../App';
import { Adventure } from './AdventureSelection';
import AudioManager from '../lib/audio';
import { Card, CardContent } from './ui/Card';
import { useWebSocket } from '../WebSocketContext';
import GameScreen from './GameScreen';
import ErrorScreen from './ErrorScreen';
import GameOverScreen from './GameOverScreen';
import { useGameContext } from './GameContext';
import { Leaderboard, LeaderboardEntry } from './Leaderboard';
import Timer from './TimerComponent';
import CountdownBuffer from './CountdownBuffer';

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
  const [isWaiting, setIsWaiting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(30);
  const { lastMessage, sendMessage } = useWebSocket();
  const gameRef = useRef<any>(null);
  const { setScore, gameOver, setGameOver, setGameWon, elapsedTime, setElapsedTime } = useGameContext();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>();
  const [showCountdown, setShowCountdown] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Handle WebSocket messages
  useEffect(() => {
    if (lastMessage) {
      try {
        const data = JSON.parse(typeof lastMessage === 'string' ? lastMessage : JSON.stringify(lastMessage));
        console.log('Game received message:', data);

        switch (data.action) {
          case 'nextQuestion':
            // Reset state for next question
            setCurrentQuestionIndex(data.questionIndex);
            setIsWaiting(false);
            setShowCountdown(true);
            setElapsedTime(0);
            setTimeRemaining(30);
            break;

          case 'gameComplete':
            setIsWaiting(false);
            setIsPaused(true);
            if(data.players) {
              setLeaderboard(data.players.map((player: LeaderboardEntry) => ({
                userId: player.userId,
                username: player.username,
                score: player.score,
                time: player.time,
                adventureId: adventure.id,
                adventureName: adventure.name
              })));
            }
            setGameOver(true);
            setGameWon(true);
            AudioManager.getInstance().stopGameMusic();
            AudioManager.getInstance().playGameCompletedSound();
            
            // Handle game over (could navigate to results page or show modal)
            break;
        }
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    }
  }, [lastMessage, userProfile.userId]);

  // Timer effect
  useEffect(() => {
    if (!isPaused && !isWaiting) {
      AudioManager.getInstance().startGameMusic();
      timerRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1);
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleWrongAnswer();
            return 30;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isPaused, isWaiting]);

  const handleCorrectAnswer = async () => {
    try {
      // Pause the snake and timer
      setIsPaused(true);
      gameRef.current?.pauseGame();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      AudioManager.getInstance().playCorrectAnswerSound();

      const response = await sendMessage({
        action: 'submitAnswer',
        sessionId: sessionId,
        userId: userProfile.userId,
        correct: true,
        timeElapsed: elapsedTime,
        questionId: currentQuestionIndex
      });

      if(response && response.score) {
        setScore(response.score);
      }
      if (response.players) {
        setLeaderboard(response.players.map((player: LeaderboardEntry) => ({
          userId: player.userId,
          username: player.username,
          score: player.score,
          time: player.time,
          adventureId: adventure.id,
          adventureName: adventure.name
        })));
      }

      // Show waiting state
      setIsWaiting(true);
    } catch (error) {
      console.error('Error submitting correct answer:', error);
      // Resume the game if there's an error
      setIsPaused(false);
      gameRef.current?.resumeGame();
    }
  };

  const handleWrongAnswer = async () => {
    try {
      // Pause the snake and timer
      setIsPaused(true);
      gameRef.current?.pauseGame();

      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      AudioManager.getInstance().playWrongAnswerSound();

      const response = await sendMessage({
        action: 'submitAnswer',
        sessionId: sessionId,
        userId: userProfile.userId,
        correct: false,
        timeElapsed: elapsedTime,
        questionId: currentQuestionIndex
      });

      if(response && response.score) {
        setScore(response.score);
      }
      if (response.players) {
        setLeaderboard(response.players.map((player: LeaderboardEntry) => ({
          userId: player.userId,
          username: player.username,
          score: player.score,
          time: player.time,
          adventureId: adventure.id,
          adventureName: adventure.name
        })));
      }

      // Show waiting state
      setIsWaiting(true);
    } catch (error) {
      console.error('Error submitting wrong answer:', error);
      // Resume the game if there's an error
      setIsPaused(false);
      gameRef.current?.resumeGame();
    }
  };

  // Polling effect for checking question state
  useEffect(() => {
    let pollInterval: NodeJS.Timeout | null = null;
    
    const startPolling = () => {
        pollInterval = setInterval(async () => {
          const response = await sendMessage({
              action: 'checkQuestionState',
              sessionId: sessionId,
              questionId: currentQuestionIndex
          });
          if (response.players) {
            setLeaderboard(response.players.map((player: LeaderboardEntry) => ({
              userId: player.userId,
              username: player.username,
              score: player.score,
              time: player.time,
              adventureId: adventure.id,
              adventureName: adventure.name
            })));
          }
        }, 2000);
    };

    if (isWaiting) {
        startPolling();
    }

    return () => {
        if (pollInterval) {
            clearInterval(pollInterval);
            pollInterval = null;
        }
    };
}, [isWaiting, sendMessage, sessionId]);


  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      AudioManager.getInstance().stopGameMusic();
    };
  }, []);
  
  if (gameOver) {
    return (
      <GameOverScreen
        adventureId={adventure.id!}
        leaderboard={leaderboard}
      />
    );
  }
  
  if (adventure && !gameOver) {
    return (
      <div>
        <div className="fixed top-4 right-4 z-50">
          <Timer timeRemaining={timeRemaining} />
        </div>
        <Card className="w-full h-full">
          <CardContent className="p-0">
            {!showCountdown && (
              <GameScreen
                ref={gameRef}
                adventure={adventure}
                currentQuestionIndex={currentQuestionIndex}
                handleCorrectAnswer={handleCorrectAnswer}
                handleWrongAnswer={handleWrongAnswer}
              />
            )}
          </CardContent>
        </Card>
        {showCountdown && (
          <CountdownBuffer preText='Next Question in' onComplete={() => {
            setShowCountdown(false);
            setIsPaused(false);
            gameRef.current?.resetGrid();
          }} />
        )}
        {!showCountdown && isWaiting && !gameRef.current?.gameOver && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-3/4 max-w-4xl">
              <h3 className="text-xl font-bold mb-4">
                Waiting for other players...
              </h3>
              <Leaderboard 
                entries={leaderboard!}
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <ErrorScreen />
  );

};

export default MultiplayerGame;
