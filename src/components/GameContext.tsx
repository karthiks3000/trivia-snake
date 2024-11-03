// GameContext.tsx
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import api from '../api';

interface GameContextType {
  // Add all the state and functions you want to share
  score: number;
  setScore: React.Dispatch<React.SetStateAction<number>>;
  elapsedTime: number;
  setElapsedTime: React.Dispatch<React.SetStateAction<number>>;
  username: string;
  setUsername: React.Dispatch<React.SetStateAction<string>>;
  gameOver: boolean;
  setGameOver: React.Dispatch<React.SetStateAction<boolean>>;
  gameWon: boolean;
  setGameWon: React.Dispatch<React.SetStateAction<boolean>>;
  updateLeaderboard: (finalScore: number) => Promise<void>;
  formatTime: (seconds: number) => string;
}

const GameContext = createContext<GameContextType | undefined>(undefined);
interface GameProviderProps {
    children: ReactNode;
  }
  
  export const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
  const [score, setScore] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [username, setUsername] = useState('');
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);

  const updateLeaderboard = useCallback(async (finalScore: number) => {
    const newEntry = { username, score: finalScore, time: elapsedTime };
    try {
      await api.addScore(newEntry);
    } catch (error) {
      console.error('Error updating leaderboard:', error);
    }
  }, [username, elapsedTime]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  return (
    <GameContext.Provider value={{
      score, setScore, elapsedTime, setElapsedTime, username, setUsername,
      gameOver, setGameOver, gameWon, setGameWon, updateLeaderboard, formatTime
    }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGameContext = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGameContext must be used within a GameProvider');
  }
  return context;
};
