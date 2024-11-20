import React from 'react';
import { useGameContext } from './GameContext';
import { Leaderboard, LeaderboardEntry } from './Leaderboard';
import { CardContent, CardHeader, CardTitle, CardDescription } from './ui/Card';
import GameCard from './ui/GameCard';
import { motion } from 'framer-motion';
import { slideIn } from '../styles/theme';
import { Trophy, Clock, Redo } from 'lucide-react';
import { formatTime } from '../lib/utils';

interface GameOverScreenProps {
  resetGame?: () => void;
  leaderboard?: LeaderboardEntry[];
  adventureId: string;
}

const GameOverScreen: React.FC<GameOverScreenProps> = ({ 
  resetGame, 
  leaderboard,
  adventureId
}) => {
  const { score, elapsedTime, gameWon } = useGameContext();

  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-120px)] p-4">
      <GameCard className="w-full max-w-2xl animate-float">
      <CardHeader className="relative flex flex-col items-center"> {/* Changed to flex-col and added relative */}
        {resetGame && (
          <motion.button
            onClick={resetGame}
            className="game-button flex items-center justify-center gap-2 absolute left-5" // Added absolute positioning
            variants={slideIn}
            initial="initial"
            animate="animate"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}>
            <Redo className="h-4 w-4" />
            <span>Play Again</span>
          </motion.button>
        )}
        <CardTitle className="text-3xl font-bold">
          {gameWon ? "Congratulations!" : "Game Over"}
        </CardTitle>
      </CardHeader>

        <CardDescription className="text-xl text-center mt-2">
          {gameWon ? "You've completed all questions!" : "Better luck next time!"}
        </CardDescription>
        <CardContent className="space-y-6 mt-4">
          <div className="flex justify-center space-x-8">
            <div className="flex items-center">
              <Trophy className="h-8 w-8 text-yellow-500 mr-2" />
              <div>
                <p className="text-sm text-gray-500">Final Score</p>
                <p className="text-2xl font-bold">{score}</p>
              </div>
            </div>
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-blue-500 mr-2" />
              <div>
                <p className="text-sm text-gray-500">Total Time</p>
                <p className="text-2xl font-bold">{formatTime(elapsedTime)}</p>
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2 text-center">Leaderboard</h3>
            <Leaderboard entries={leaderboard || []} adventureId={adventureId} />
          </div>
        </CardContent>
      </GameCard>
    </div>
  );
};

export default GameOverScreen;
