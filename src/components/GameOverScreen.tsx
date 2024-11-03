// GameOverScreen.tsx
import React from 'react';
import { useGameContext } from './GameContext';
import { Leaderboard, LeaderboardEntry } from './Leaderboard';

interface GameOverScreenProps {
  resetGame: () => void;
  leaderboard: LeaderboardEntry[];
}

const GameOverScreen: React.FC<GameOverScreenProps> = ({ resetGame, leaderboard }) => {
  const { score, elapsedTime, gameWon, formatTime } = useGameContext();

  return (
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
            <Leaderboard entries={leaderboard} />
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
};

export default GameOverScreen;
