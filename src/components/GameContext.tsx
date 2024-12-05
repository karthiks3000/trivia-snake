// GameContext.tsx
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import api from '../api';
import { UserProfile } from '../App';
import { Adventure } from './AdventureSelection';

interface GameContextType {
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
  const [isUpdatingLeaderboard, setIsUpdatingLeaderboard] = useState(false);

  const updateLeaderboard = useCallback(async (finalScore: number, adventure: Adventure) => {
    if (!adventure || isUpdatingLeaderboard) {
      console.error('No adventure selected or update already in progress');
      return;
    }

    setIsUpdatingLeaderboard(true);
    
    try {
      const newEntry = {
        userId: userProfile.userId,
        username: userProfile.username,
        score: finalScore,
        time: elapsedTime,
        adventureId: adventure.id!,
        adventureName: adventure.name!
      };
      
      await api.addScore(newEntry);
    } catch (error) {
      console.error('Error updating leaderboard:', error);
    } finally {
      setIsUpdatingLeaderboard(false);
    }
  }, [elapsedTime, userProfile, isUpdatingLeaderboard]);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = React.useMemo(() => ({
    score,
    setScore,
    elapsedTime,
    setElapsedTime,
    userProfile,
    gameOver,
    setGameOver,
    gameWon,
    setGameWon,
    updateLeaderboard
  }), [
    score,
    elapsedTime,
    userProfile,
    gameOver,
    gameWon,
    updateLeaderboard
  ]);

  return (
    <GameContext.Provider value={contextValue}>
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
