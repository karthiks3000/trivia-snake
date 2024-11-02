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
      return <StartScreen onStart={handleStart} />;
    }

    const resetGame = () => {
        setCurrentQuestionIndex(0);
        setScore(0);
        setGameOver(false);
        setElapsedTime(0);
        setGameWon(false);
      };
  
      if (gameOver) {
        return (
          <GameOverContainer>
            <GameOverMessage>
              {gameWon 
                ? "Congratulations! You've completed all questions!" 
                : "Game Over! Better luck next time!"}
            </GameOverMessage>
            <GameStats>Final Score: {score}</GameStats>
            <GameStats>Total Time: {formatTime(elapsedTime)}</GameStats>
            <h3>Leaderboard</h3>
            {leaderboard.length > 0 ? (
              <LeaderboardTable>
                <thead>
                  <tr>
                    <TableHeader>Rank</TableHeader>
                    <TableHeader>Username</TableHeader>
                    <TableHeader>Score</TableHeader>
                    <TableHeader>Time</TableHeader>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((entry, index) => (
                    <tr key={index}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{entry.username}</TableCell>
                      <TableCell>{entry.score}</TableCell>
                      <TableCell>{formatTime(entry.time)}</TableCell>
                    </tr>
                  ))}
                </tbody>
              </LeaderboardTable>
            ) : (
              <p>No leaderboard entries yet.</p>
            )}
            <PlayAgainButton onClick={resetGame}>Play Again</PlayAgainButton>
          </GameOverContainer>
        );
      }
      
  
    return (
      <>
        <InfoBar>
        <span>Score: {score}</span>
        <span>Time: {formatTime(elapsedTime)}</span>
        <span>Current Rank: {getCurrentRank()}</span>
      </InfoBar>
        <GameContainer>
          <QuestionArea>
            <Question question={sampleQuestions[currentQuestionIndex]} />
          </QuestionArea>
          <GameArea>
            <Grid
              options={sampleQuestions[currentQuestionIndex].options}
              correctAnswer={sampleQuestions[currentQuestionIndex].correctAnswer}
              onCorrectAnswer={handleCorrectAnswer}
              onWrongAnswer={handleWrongAnswer}
              score={score}
              elapsedTime={elapsedTime}
            />
          </GameArea>
        </GameContainer>
      </>
    );
  };
  
  export default Game;