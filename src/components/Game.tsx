import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { GameProvider, useGameContext } from './GameContext';
import StartScreen from './StartScreen';
import LoadingScreen from './LoadingScreen';
import ErrorScreen from './ErrorScreen';
import GameOverScreen from './GameOverScreen';
import GameScreen from './GameScreen';
import api from '../api';
import { LeaderboardEntry } from './Leaderboard';

interface TriviaQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
}

interface Adventure {
  adventure: string;
  questions: TriviaQuestion[];
}

const GameInner: React.FC = () => {
  const { 
    setScore, 
    setGameOver, 
    setGameWon, 
    updateLeaderboard: updateLeaderboardFromContext,
    score,
    elapsedTime,
    setElapsedTime,
    username,
    setUsername,
    gameOver,
  } = useGameContext();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [adventure, setAdventure] = useState<Adventure | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const response = await api.getLeaderboard();
      setLeaderboard(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      setLeaderboard([]);
    }
  }, []);

  const fetchQuestions = useCallback(async (adventureName: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/data/${adventureName}.json`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data: Adventure = await response.json();
      setAdventure(data);
      setError(null);
    } catch (error) {
      console.error('Error fetching questions:', error);
      setError("Error loading game data. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleStart = useCallback((name: string, selectedAdventure: string) => {
    setUsername(name);
    fetchQuestions(selectedAdventure);
    setGameStarted(true);
  }, [fetchQuestions]);

  const currentQuestion = useMemo(() => {
    if (adventure && currentQuestionIndex < adventure.questions.length) {
      const question = adventure.questions[currentQuestionIndex];
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
  }, [adventure, currentQuestionIndex]);

  const resetGame = useCallback(() => {
    setCurrentQuestionIndex(0);
    setScore(0);
    setGameOver(false);
    setGameWon(false);
    setGameStarted(true);
    setElapsedTime(0);
  }, [setScore, setGameOver, setGameWon, setElapsedTime]);

  const handleCorrectAnswer = useCallback(() => {
    setScore(prevScore => {
      const newScore = prevScore + 1;
      if (currentQuestionIndex === adventure!.questions.length - 1) {
        setGameWon(true);
        setGameOver(true);
        updateLeaderboardFromContext(newScore);
        fetchLeaderboard();
      } else {
        setCurrentQuestionIndex(prevIndex => prevIndex + 1);
      }
      return newScore;
    });
  }, [currentQuestionIndex, updateLeaderboardFromContext, adventure, setGameWon, setGameOver, setScore]);

  const handleWrongAnswer = useCallback(() => {
    setGameOver(true);
    updateLeaderboardFromContext(score);
    fetchLeaderboard();
  }, [updateLeaderboardFromContext, score, setGameOver]);

  const getCurrentRank = useCallback(() => {
    const currentEntry = { username: username, score, time: elapsedTime };
    const rankList = [...leaderboard, currentEntry]
      .sort((a, b) => b.score - a.score || a.time - b.time);
    return rankList.findIndex(entry => entry === currentEntry) + 1;
  }, [score, elapsedTime, leaderboard]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (gameStarted && !gameOver) {
      timer = setInterval(() => setElapsedTime(prevTime => prevTime + 1), 1000);
    }
    return () => { if (timer) clearInterval(timer); };
  }, [gameStarted, gameOver, setElapsedTime]);

  if (gameStarted && isLoading) return <LoadingScreen />;
  if (gameStarted && !adventure) return <ErrorScreen />;
  if (!gameStarted) return <StartScreen onStart={handleStart} error={error} />;
  if (gameOver) return <GameOverScreen resetGame={resetGame} leaderboard={leaderboard} />;
  if (currentQuestion) {
    return (
      <GameScreen
        currentQuestion={currentQuestion}
        handleCorrectAnswer={handleCorrectAnswer}
        handleWrongAnswer={handleWrongAnswer}
        getCurrentRank={getCurrentRank}
      />
    );
  }

  return null;
};

const Game: React.FC = () => {
  return (
    <GameProvider>
      <GameInner />
    </GameProvider>
  );
};

export default Game;

