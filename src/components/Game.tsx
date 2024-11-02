import React, { useState, useCallback, useEffect } from 'react';
import styled from 'styled-components';
import Grid from './Grid';
import Question from './Question';
import StartScreen from './StartScreen';

const GameContainer = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 20px;
`;

const GameArea = styled.div`
  width: 60%;
`;

const QuestionArea = styled.div`
  width: 35%;
`;

const InfoBar = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
  font-size: 18px;
`;

const GameOverContainer = styled.div`
  text-align: center;
  font-size: 24px;
`;

const GameOverMessage = styled.h2`
  margin-bottom: 20px;
`;

const GameStats = styled.p`
  margin: 10px 0;
`;
const LeaderboardTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
`;

const TableHeader = styled.th`
  background-color: #f2f2f2;
  padding: 10px;
  text-align: left;
`;

const TableCell = styled.td`
  padding: 10px;
  border-bottom: 1px solid #ddd;
`;

const PlayAgainButton = styled.button`
  padding: 10px 20px;
  font-size: 18px;
  background-color: #4CAF50;
  color: white;
  border: none;
  cursor: pointer;
  margin-top: 20px;

  &:hover {
    background-color: #45a049;
  }
`;

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

const sampleQuestions: TriviaQuestion[] = [
    {
      question: "What is the capital of France?",
      options: ["London", "Berlin", "Paris", "Madrid"],
      correctAnswer: "C"
    },
    {
      question: "Which planet is known as the Red Planet?",
      options: ["Venus", "Mars", "Jupiter", "Saturn"],
      correctAnswer: "B"
    },
    {
      question: "Who painted the Mona Lisa?",
      options: ["Vincent van Gogh", "Pablo Picasso", "Leonardo da Vinci", "Michelangelo"],
      correctAnswer: "C"
    },
    {
      question: "What is the largest ocean on Earth?",
      options: ["Atlantic Ocean", "Indian Ocean", "Arctic Ocean", "Pacific Ocean"],
      correctAnswer: "D"
    },
    {
      question: "Which element has the chemical symbol 'O'?",
      options: ["Gold", "Silver", "Oxygen", "Iron"],
      correctAnswer: "C"
    },
    {
      question: "Who wrote the play 'Romeo and Juliet'?",
      options: ["Charles Dickens", "William Shakespeare", "Jane Austen", "Mark Twain"],
      correctAnswer: "B"
    },
    {
      question: "What is the largest mammal in the world?",
      options: ["African Elephant", "Blue Whale", "Giraffe", "Hippopotamus"],
      correctAnswer: "B"
    },
    {
      question: "In which year did World War II end?",
      options: ["1943", "1944", "1945", "1946"],
      correctAnswer: "C"
    },
    {
      question: "What is the capital of Japan?",
      options: ["Seoul", "Beijing", "Tokyo", "Bangkok"],
      correctAnswer: "C"
    },
    {
      question: "Who invented the telephone?",
      options: ["Thomas Edison", "Alexander Graham Bell", "Nikola Tesla", "Guglielmo Marconi"],
      correctAnswer: "B"
    }
  ];
  

  const Game: React.FC = () => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [gameWon, setGameWon] = useState(false);
    const [username, setUsername] = useState('');
    const [gameStarted, setGameStarted] = useState(false);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

    const resetGame = useCallback(() => {
        setCurrentQuestionIndex(0);
        setScore(0);
        setGameOver(false);
        setElapsedTime(0);
        setGameWon(false);
        // Add any other state resets here
      }, []); // Add dependencies if needed


    useEffect(() => {
      const storedLeaderboard = localStorage.getItem('trivia_snake_leaderboard');
      if (storedLeaderboard) {
        setLeaderboard(JSON.parse(storedLeaderboard));
      }
    }, []);
  
    useEffect(() => {
      console.log('Leaderboard updated:', leaderboard);
    }, [leaderboard]);
  
    const updateLeaderboard = useCallback(() => {
      const newEntry: LeaderboardEntry = { username, score, time: elapsedTime };
      const updatedLeaderboard = [...leaderboard, newEntry]
        .sort((a, b) => b.score - a.score || a.time - b.time)
        .slice(0, 10);
      
      localStorage.setItem('trivia_snake_leaderboard', JSON.stringify(updatedLeaderboard));
      
      return updatedLeaderboard;
    }, [username, score, elapsedTime, leaderboard]);
  
    const handleCorrectAnswer = useCallback(() => {
      setScore(prevScore => prevScore + 1);
      if (currentQuestionIndex < sampleQuestions.length - 1) {
        setCurrentQuestionIndex(prevIndex => prevIndex + 1);
      } else {
        setGameWon(true);
        setGameOver(true);
        const updatedLeaderboard = updateLeaderboard();
        setLeaderboard(updatedLeaderboard);
      }
    }, [currentQuestionIndex, updateLeaderboard]);
  
    const handleWrongAnswer = useCallback(() => {
      setGameOver(true);
      const updatedLeaderboard = updateLeaderboard();
      setLeaderboard(updatedLeaderboard);
    }, [updateLeaderboard]);

    const getCurrentRank = () => {
        const currentEntry = { username, score, time: elapsedTime };
        const rankList = [...leaderboard, currentEntry]
          .sort((a, b) => b.score - a.score || a.time - b.time);
        return rankList.findIndex(entry => entry === currentEntry) + 1;
      };
    
  
    useEffect(() => {
      let timer: NodeJS.Timeout;
      if (gameStarted && !gameOver) {
        timer = setInterval(() => {
          setElapsedTime(prevTime => prevTime + 1);
        }, 1000);
      }
      return () => clearInterval(timer);
    }, [gameStarted, gameOver]);
  
    const handleStart = (name: string) => {
      setUsername(name);
      setGameStarted(true);
    };
    
  
    const formatTime = (seconds: number) => {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
    };
  
   
  if (!gameStarted) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-120px)]">
        <div className="relative py-3 sm:max-w-xl sm:mx-auto">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-light-blue-500 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>
          <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
            <StartScreen onStart={handleStart} />
          </div>
        </div>
      </div>
    );
  }

  if (gameOver) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-120px)]">
        <div className="relative py-3 sm:max-w-xl sm:mx-auto">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-light-blue-500 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>
          <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">
                {gameWon 
                  ? "Congratulations! You've completed all questions!" 
                  : "Game Over! Better luck next time!"}
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
  }

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-120px)]">
      <div className="md:w-1/3 p-4">
        <div className="mb-4 flex justify-between text-lg">
          <span>Score: {score}</span>
          <span>Time: {formatTime(elapsedTime)}</span>
        </div>
        <div className="mb-4">
          <span className="text-lg">Current Rank: {getCurrentRank()}</span>
        </div>
        <Question question={sampleQuestions[currentQuestionIndex]} />
      </div>
      <div className="md:w-2/3 p-4">
        <Grid
          options={sampleQuestions[currentQuestionIndex].options}
          correctAnswer={sampleQuestions[currentQuestionIndex].correctAnswer}
          onCorrectAnswer={handleCorrectAnswer}
          onWrongAnswer={handleWrongAnswer}
          score={score}
          elapsedTime={elapsedTime}
        />
      </div>
    </div>
  );
};

export default Game;