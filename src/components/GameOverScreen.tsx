import React from 'react';
import { useGameContext } from './GameContext';
import { Leaderboard, LeaderboardEntry } from './Leaderboard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from './ui/Card';
import { Button } from './ui/Button';
import { Trophy, Clock, Redo } from 'lucide-react';

interface GameOverScreenProps {
  resetGame: () => void;
  leaderboard: LeaderboardEntry[];
}

const GameOverScreen: React.FC<GameOverScreenProps> = ({ resetGame, leaderboard }) => {
  const { score, elapsedTime, gameWon, formatTime } = useGameContext();

  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-120px)] p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">
            {gameWon ? "Congratulations!" : "Game Over"}
          </CardTitle>
          <CardDescription className="text-xl text-center">
            {gameWon ? "You've completed all questions!" : "Better luck next time!"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
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
        <CardFooter className="flex justify-center">
          <Button onClick={resetGame} className="bg-indigo-600 hover:bg-indigo-700">
            <Redo className="h-4 w-4 mr-2" />
            Play Again
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default GameOverScreen;
