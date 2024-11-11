import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useGameContext } from './GameContext';
import LoadingScreen from './LoadingScreen';
import ErrorScreen from './ErrorScreen';
import GameOverScreen from './GameOverScreen';
import GameScreen from './GameScreen';
import { api } from '../api';
import { LeaderboardEntry } from './Leaderboard';
import { Card, CardContent } from './ui/Card';
import { Adventure } from '../interface';
import { useLocation } from 'react-router-dom';


interface SinglePlayerGameProps {
  selectedAdventure: Adventure | null;
}

const SinglePlayerGame: React.FC<SinglePlayerGameProps> = ({ selectedAdventure }) => {
  const { 
    setScore,
    setGameOver, 
    setGameWon, 
    updateLeaderboard: updateLeaderboardFromContext,
    score,
    elapsedTime,
    setElapsedTime,
    gameOver,
    userProfile
  } = useGameContext();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [adventure, setAdventure] = useState<Adventure | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [questionTimer, setQuestionTimer] = useState(10);

  console.log(`Game started for user: ${userProfile.username} (ID: ${userProfile.userId}`);

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
    if (!selectedAdventure) return;
    setIsLoading(true);
    try {
      const response = await api.getAdventure(selectedAdventure.id!);
      if (!response.data) throw new Error(`HTTP error! status: ${response.status}`);
      setAdventure(response.data);
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
    setElapsedTime(0);
    setQuestionTimer(10);
    fetchQuestions();
  }, [setScore, setGameOver, setGameWon, setElapsedTime, fetchQuestions]);

  const handleCorrectAnswer = useCallback(() => {
    setScore(prevScore => {
      const newScore = prevScore + 1;
      if (adventure && currentQuestionIndex === adventure.questions.length - 1) {
        setGameWon(true);
        setGameOver(true);
        updateLeaderboardFromContext(newScore, selectedAdventure!).then(() => fetchLeaderboard());
      } else {
        setCurrentQuestionIndex(prevIndex => prevIndex + 1);
      }
      return newScore;
    });
    setQuestionTimer(10);
  }, [adventure, currentQuestionIndex, selectedAdventure, setGameOver, setGameWon, setScore, updateLeaderboardFromContext, fetchLeaderboard]);

  const handleWrongAnswer = useCallback(() => {
    setGameOver(true);
    updateLeaderboardFromContext(score, selectedAdventure!).then(() => fetchLeaderboard());
  }, [score, selectedAdventure, setGameOver, updateLeaderboardFromContext, fetchLeaderboard]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (!gameOver) {
      timer = setInterval(() => {
        setElapsedTime(prevTime => prevTime + 1);
        setQuestionTimer(prevTimer => {
          if (prevTimer > 0) {
            return prevTimer - 1;
          } else {
            handleWrongAnswer();
            return 10;
          }
        });
      }, 1000);
    }
    return () => { if (timer) clearInterval(timer); };
  }, [gameOver, setElapsedTime, handleWrongAnswer]);

  if (isLoading) return <LoadingScreen />;
  if (error) return <ErrorScreen />;
  if (gameOver) return <GameOverScreen resetGame={resetGame} leaderboard={leaderboard} />;

  if (currentQuestion) {
    return (
      <Card className="w-full h-full">
        <CardContent className="p-0">
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

export default SinglePlayerGame;
