import React, { useState, useEffect, useRef } from 'react';
import { UserProfile } from '../App';
import { Adventure } from './AdventureSelection';
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
                time: elapsedTime,
                adventureId: adventure.id,
                adventureName: adventure.name
              })));
            }
            setGameOver(true);
            setGameWon(true);
            
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
          time: elapsedTime,
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
          time: elapsedTime,
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
              time: elapsedTime,
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
    };
  }, []);
  
  if (gameOver) {
    return (
      <GameOverScreen
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

  // return (
  //   <div className="container mx-auto p-4 h-full">
  //     <div className="grid grid-cols-[1fr_2fr] gap-4 h-full">
  //       {/* Left side - Question and Options */}
  //       <div className="space-y-4">
  //         {/* Question */}
  //         <Card>
  //           <CardContent className="p-4">
  //             <h2 className="text-xl font-bold mb-4">
  //               Question {currentQuestionIndex + 1} of {adventure.questions.length}
  //             </h2>
  //             <p className="text-lg">
  //               {currentQuestion.question}
  //             </p>
  //           </CardContent>
  //         </Card>

  //         {/* Options */}
  //         <Card>
  //           <CardContent className="p-4">
  //             <h3 className="text-lg font-bold mb-2">Options:</h3>
  //             <div className="space-y-2">
  //               {currentQuestion.options.map((option, index) => (
  //                 <div key={index} className="flex items-center space-x-2">
  //                   <span className="font-bold">{String.fromCharCode(65 + index)}:</span>
  //                   <span>{option}</span>
  //                 </div>
  //               ))}
  //             </div>
  //           </CardContent>
  //         </Card>

  //         {/* Scores */}
  //         <Card>
  //           <CardContent className="p-4">
  //             <h3 className="text-lg font-bold mb-2">Scores:</h3>
  //             <div className="space-y-2">
  //               {playerScores.map((player) => (
  //                 <div 
  //                   key={player.userId}
  //                   className={`flex justify-between items-center p-2 rounded ${
  //                     player.userId === userProfile.userId ? 'bg-blue-100' : 'bg-gray-100'
  //                   }`}
  //                 >
  //                   <span>{player.username}</span>
  //                   <span className="font-bold">{player.score}</span>
  //                 </div>
  //               ))}
  //             </div>
  //           </CardContent>
  //         </Card>
  //       </div>

  //       {/* Right side - Game Grid */}
  //       <div className="relative">
  //         <div className="aspect-square w-full">
  //           <Grid
  //             ref={gridRef}
  //             options={currentQuestion.options}
  //             correctLetter={currentQuestion.correctAnswer}
  //             onCorrectAnswer={handleCorrectAnswer}
  //             onWrongAnswer={handleWrongAnswer}
  //             isPaused={isPaused}
  //           />

  //           {/* Waiting overlay */}
  //           {isWaiting && (
  //             <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
  //               <div className="bg-white p-6 rounded-lg shadow-xl">
  //                 <h3 className="text-xl font-bold mb-4">
  //                   Waiting for other players...
  //                 </h3>
  //                 <div className="text-center text-gray-600">
  //                   {playerScores.length} of {playerScores.length} players answered
  //                 </div>
  //               </div>
  //             </div>
  //           )}
  //         </div>
  //       </div>
  //     </div>
  //   </div>
  // );
};

export default MultiplayerGame;
