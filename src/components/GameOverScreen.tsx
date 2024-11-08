import React from 'react';
import { useGameContext } from './GameContext';
import { Leaderboard, LeaderboardEntry } from './Leaderboard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/Card';
import { Button } from './ui/Button';
import { Trophy, Clock, Redo, ArrowRightLeft } from 'lucide-react';
import { formatTime } from '../lib/utils';

interface GameOverScreenProps {
  resetGame: () => void;
  leaderboard: LeaderboardEntry[];
}

const GameOverScreen: React.FC<GameOverScreenProps> = ({ resetGame, leaderboard }) => {
  const { score, elapsedTime, gameWon } = useGameContext();

  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-120px)] p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <Button onClick={resetGame} className="bg-indigo-600 hover:bg-indigo-700">
            <Redo className="h-4 w-4 mr-2" />
            Play Again
          </Button>
          <CardTitle className="text-3xl font-bold text-center">
            {gameWon ? "Congratulations!" : "Game Over"}
          </CardTitle>
          <Button onClick={() => window.location.reload()}>
            <ArrowRightLeft className="h-4 w-4 mr-2" />
            Adventure
          </Button>
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
            <Leaderboard entries={leaderboard} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GameOverScreen;
