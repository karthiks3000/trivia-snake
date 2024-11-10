import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { GameProvider, useGameContext } from './GameContext';
import LoadingScreen from './LoadingScreen';
import ErrorScreen from './ErrorScreen';
import GameOverScreen from './GameOverScreen';
import GameScreen from './GameScreen';
import MultiplayerLobby from './MultiplayerLobby';
import api from '../api';
import { LeaderboardEntry } from './Leaderboard';
import { UserProfile } from '../App';
import { Card, CardContent } from './ui/Card';
import { Adventure } from './AdventureSelection';
import { generateClient } from '@aws-amplify/api';
import { GraphQLQuery, GraphQLSubscription } from '@aws-amplify/api';
import MultiplayerGame from './MultiplayerGame';
import SinglePlayerGame from './SinglePlayerGame';

interface GameProps {
  adventure: Adventure;
  userProfile: UserProfile;
}

const GameInner: React.FC<GameProps> = ({ adventure: selectedAdventure, userProfile }) => {
  const { 
    isMultiplayer,
    setIsMultiplayer,
    sessionId,
    setSessionId,
    setScore,
    setPlayer2Score,
    setGameOver,
    setGameWon,
    setElapsedTime,
    setPlayer2Profile,
    setCurrentQuestionIndex,
    updateLeaderboard,
    score,
    gameOver,
  } = useGameContext();

  const [showGameModeSelection, setShowGameModeSelection] = useState(true);
  const [showMultiplayerLobby, setShowMultiplayerLobby] = useState(false);
  const [questionTimer, setQuestionTimer] = useState(10);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adventure, setAdventure] = useState<Adventure | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  const client = useMemo(() => generateClient(), []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isMultiplayer && sessionId) {
      timer = setInterval(() => {
        setQuestionTimer((prevTimer) => {
          if (prevTimer > 0) {
            return prevTimer - 1;
          } else {
            // Time's up, handle as wrong answer
            handleWrongAnswer();
            return 10;
          }
        });
      }, 1000);
    }
    return () => { if (timer) clearInterval(timer); };
  }, [isMultiplayer, sessionId]);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const response = await api.getLeaderboard();
      setLeaderboard(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      setLeaderboard([]);
    }
  }, []);

  const fetchQuestions = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.getAdventure(selectedAdventure.id!);
      if (!response.data) throw new Error(`HTTP error! status: ${response.status}`);
      const data: Adventure = await response.data;
      setAdventure(data);
      setError(null);
    } catch (error) {
      console.error('Error fetching questions:', error);
      setError("Error loading game data. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  }, [selectedAdventure]);

  useEffect(() => {
    fetchQuestions();
    fetchLeaderboard();
  }, [fetchQuestions, fetchLeaderboard]);

  const currentQuestion = useMemo(() => {
    if (adventure && adventure.questions.length > 0) {
      const question = adventure.questions[0]; // Get first question for now
      const shuffledOptions = [...question.options].sort(() => Math.random() - 0.5);
      const correctAnswerIndex = shuffledOptions.findIndex(option => option === question.correctAnswer);
      return { 
        question: question.question,
        options: shuffledOptions, 
        correctAnswer: question.correctAnswer,
        correctLetter: String.fromCharCode(65 + correctAnswerIndex)
      };
    }
    return null;
  }, [adventure]);

  const resetGame = useCallback(() => {
    setCurrentQuestionIndex(0);
    setScore(0);
    setPlayer2Score(0);
    setGameOver(false);
    setGameWon(false);
    setElapsedTime(0);
    if (isMultiplayer) {
      setSessionId(null);
      setPlayer2Profile(null);
      setIsMultiplayer(false);
    }
    fetchQuestions();
  }, [setScore, setPlayer2Score, setGameOver, setGameWon, setElapsedTime, fetchQuestions, isMultiplayer, setSessionId, setPlayer2Profile, setIsMultiplayer, setCurrentQuestionIndex]);

  const handleCorrectAnswer = useCallback(() => {
    setScore(prevScore => {
      const newScore = prevScore + 1;
      if (adventure && adventure.questions.length === 1) {
        setGameWon(true);
        setGameOver(true);
        updateLeaderboard(newScore, selectedAdventure).then(() => fetchLeaderboard());
      }
      return newScore;
    });
    setQuestionTimer(10);
  }, [adventure, setScore, setGameWon, setGameOver, selectedAdventure, fetchLeaderboard]);

  const handleWrongAnswer = useCallback(() => {
    setGameOver(true);
    updateLeaderboard(score, selectedAdventure).then(() => fetchLeaderboard());
  }, [score, selectedAdventure, setGameOver, fetchLeaderboard]);

  if (showMultiplayerLobby) {
    return <MultiplayerLobby />;
  }

  if (isMultiplayer && sessionId) {
    return <MultiplayerGame sessionId={sessionId} userProfile={{
      userId: userProfile.userId,
      isHost: false
    }} />;
  }

  if (showGameModeSelection) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-3xl font-bold mb-8">Choose Game Mode</h1>
        <div className="space-x-4">
          <button
            onClick={() => {
              setShowMultiplayerLobby(true);
              setShowGameModeSelection(false);
              setIsMultiplayer(true);
            }}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Play Multiplayer
          </button>
          <button
            onClick={() => {
              setIsMultiplayer(false);
              setSessionId(null);
              setShowGameModeSelection(false);
            }}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            Play Single Player
          </button>
        </div>
      </div>
    );
  }

  // Show SinglePlayerGame when not in multiplayer mode
  if (!isMultiplayer && adventure && !showGameModeSelection) {
    return <SinglePlayerGame adventure={adventure!} />;
  }

  if (isLoading) return <LoadingScreen />;
  if (error) return <ErrorScreen />;
  if (gameOver) return <GameOverScreen resetGame={resetGame} leaderboard={leaderboard} />;

  if (currentQuestion) {
    return (
      <Card className="w-full h-full flex">
        <CardContent className="p-0 flex-grow">
          <GameScreen
            currentQuestion={currentQuestion}
            handleCorrectAnswer={handleCorrectAnswer}
            handleWrongAnswer={handleWrongAnswer}
            questionTimer={questionTimer}
          />
        </CardContent>
      </Card>
    );
  }

  return null;
};

const Game: React.FC<GameProps> = ({ adventure, userProfile }) => {
  return (
    <GameProvider userProfile={userProfile}>
      <GameInner adventure={adventure} userProfile={userProfile} />
    </GameProvider>
  );
};

export default Game;
