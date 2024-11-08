// GameContext.tsx
import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import api from '../api';
import { UserProfile } from '../App';
import { Adventure } from './AdventureSelection';

interface GameContextType {
  // Add all the state and functions you want to share
  score: number;
  setScore: React.Dispatch<React.SetStateAction<number>>;
  elapsedTime: number;
  setElapsedTime: React.Dispatch<React.SetStateAction<number>>;
  userProfile: UserProfile;
  gameOver: boolean;
  setGameOver: React.Dispatch<React.SetStateAction<boolean>>;
  gameWon: boolean;
  setGameWon: React.Dispatch<React.SetStateAction<boolean>>;
  updateLeaderboard: (finalScore: number, adventure: Adventure) => Promise<void>;
}

const GameContext = createContext<GameContextType | undefined>(undefined);
interface GameProviderProps {
    children: ReactNode;
    userProfile: UserProfile;
  }
  
export const GameProvider: React.FC<GameProviderProps> = ({ children, userProfile }) => {
  const [score, setScore] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);

  const updateLeaderboard = useCallback(async (finalScore: number, adventure: Adventure) => {
    if (!adventure) {
      console.error('No adventure selected');
      return;
    }
    const newEntry = {
      userId: userProfile.userId,
      username: userProfile.username,
      score: finalScore,
      time: elapsedTime,
      adventureId: adventure.id!,
      adventureName: adventure.name!
    };
    try {
      await api.addScore(newEntry);
    } catch (error) {
      console.error('Error updating leaderboard:', error);
    }
  }, [elapsedTime]);


  return (
    <GameContext.Provider value={{
      score, setScore, elapsedTime, setElapsedTime, userProfile,
      gameOver, setGameOver, gameWon, setGameWon, updateLeaderboard
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
