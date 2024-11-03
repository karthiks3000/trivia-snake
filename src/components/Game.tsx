import React, { useState, useCallback, useEffect, useMemo } from 'react';
import Grid from './Grid';
import Question from './Question';
import StartScreen from './StartScreen';
import api from '../api';

// Interfaces
interface TriviaQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
}

interface LeaderboardEntry {
  username: string;
  score: number;
  time: number;
}

interface Adventure {
  adventure: string;
  questions: TriviaQuestion[];
}

const Game: React.FC = () => {
  // State declarations
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [username, setUsername] = useState('');
  const [gameStarted, setGameStarted] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [adventure, setAdventure] = useState<Adventure | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch leaderboard data
  const fetchLeaderboard = useCallback(async () => {
    try {
      const response = await api.getLeaderboard();
      setLeaderboard(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      setLeaderboard([]);
    }
  }, []);

  // Fetch questions for the selected adventure
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

  // Handle game start
  const handleStart = useCallback((name: string, selectedAdventure: string) => {
    setUsername(name);
    fetchQuestions(selectedAdventure);
    setGameStarted(true);
  }, [fetchQuestions]);

  // Prepare current question with shuffled options
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

  // Reset game state
  const resetGame = useCallback(() => {
    setCurrentQuestionIndex(0);
    setScore(0);
    setGameOver(false);
    setElapsedTime(0);
    setGameWon(false);
    setGameStarted(true);
  }, []);

  // Update leaderboard with new score
  const updateLeaderboard = useCallback(async (finalScore: number) => {
    const newEntry: LeaderboardEntry = { username, score: finalScore, time: elapsedTime };
    try {
      await api.addScore(newEntry);
      fetchLeaderboard();
    } catch (error) {
      console.error('Error updating leaderboard:', error);
    }
  }, [username, elapsedTime, fetchLeaderboard]);

  // Handle correct answer
  const handleCorrectAnswer = useCallback(() => {
    setScore(prevScore => {
      const newScore = prevScore + 1;
      if (currentQuestionIndex === adventure!.questions.length - 1) {
        setGameWon(true);
        setGameOver(true);
        updateLeaderboard(newScore);
      } else {
        setCurrentQuestionIndex(prevIndex => prevIndex + 1);
      }
      return newScore;
    });
  }, [currentQuestionIndex, updateLeaderboard, adventure]);

  // Handle wrong answer
  const handleWrongAnswer = useCallback(() => {
    setGameOver(true);
    updateLeaderboard(score);
  }, [updateLeaderboard, score]);

  // Calculate current rank
  const getCurrentRank = useCallback(() => {
    const currentEntry = { username, score, time: elapsedTime };
    const rankList = [...leaderboard, currentEntry]
      .sort((a, b) => b.score - a.score || a.time - b.time);
    return rankList.findIndex(entry => entry === currentEntry) + 1;
  }, [username, score, elapsedTime, leaderboard]);

  // Timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (gameStarted && !gameOver) {
      timer = setInterval(() => setElapsedTime(prevTime => prevTime + 1), 1000);
    }
    return () => { if (timer) clearInterval(timer); };
  }, [gameStarted, gameOver]);

  // Format time helper function
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  // Render functions
  const renderLoading = () => <div className="text-center mt-8">Loading questions...</div>;
  const renderError = () => <div className="text-center mt-8">Error loading questions. Please try again.</div>;

  const renderStartScreen = () => (
    <div className="flex justify-center items-center h-[calc(100vh-120px)]">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-light-blue-500 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>
        <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
          <StartScreen onStart={handleStart} error={error} />
        </div>
      </div>
    </div>
  );

  const renderGameOver = () => (
    <div className="flex justify-center items-center h-[calc(100vh-120px)]">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-light-blue-500 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>
        <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">
              {gameWon ? "Congratulations! You've completed all questions!" : "Game Over! Better luck next time!"}
            </h2>
            <p className="text-lg mb-2">Final Score: {score}</p>
            <p className="text-lg mb-4">Total Time: {formatTime(elapsedTime)}</p>
            <h3 className="text-xl font-semibold mb-2">Leaderboard</h3>
            <table className="w-full mb-4">
              <thead>
                <tr className="bg-gray-200">
                  <th className="p-2 text-left">Rank</th>
                  <th className="p-2 text-left">Username</th>
                  <th className="p-2 text-left">Score</th>
                  <th className="p-2 text-left">Time</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry, index) => (
                  <tr key={index} className="border-b">
                    <td className="p-2">{index + 1}</td>
                    <td className="p-2">{entry.username}</td>
                    <td className="p-2">{entry.score}</td>
                    <td className="p-2">{formatTime(entry.time)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button 
              onClick={resetGame}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Play Again
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderGame = () => (
    <div className="flex flex-col md:flex-row h-[calc(100vh-120px)]">
      <div className="md:w-1/3 p-4">
        <div className="mb-4 flex justify-between text-lg">
          <span>Score: {score}</span>
          <span>Time: {formatTime(elapsedTime)}</span>
        </div>
        <div className="mb-4">
          <span className="text-lg">Current Rank: {getCurrentRank()}</span>
        </div>
        <Question 
          question={currentQuestion!.question}
          options={currentQuestion!.options}
        />
      </div>
      <div className="md:w-2/3 p-4">
        <Grid
          options={currentQuestion!.options}
          correctAnswer={currentQuestion!.correctLetter}
          onCorrectAnswer={handleCorrectAnswer}
          onWrongAnswer={handleWrongAnswer}
          score={score}
          elapsedTime={elapsedTime}
        />
      </div>
    </div>
  );

  // Main render logic
  if (gameStarted && isLoading) return renderLoading();
  if (gameStarted && !adventure) return renderError();
  if (!gameStarted) return renderStartScreen();
  if (gameOver) return renderGameOver();
  if (currentQuestion) return renderGame();

  // This should never happen, but we'll add it for type safety
  return null;
};

export default Game;

