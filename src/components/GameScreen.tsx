import React from 'react';
import { useGameContext } from './GameContext';
import Question from './Question';
import Grid from './Grid';
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";
import { Clock, Trophy } from 'lucide-react';
import { formatTime } from '../lib/utils';

interface GameScreenProps {
  currentQuestion: any,
  handleCorrectAnswer: () => void;
  handleWrongAnswer: () => void;
  questionTimer: number;
}

const GameScreen: React.FC<GameScreenProps> = ({ 
  currentQuestion, 
  handleCorrectAnswer,
  handleWrongAnswer, 
  questionTimer 
}) => {
  const { score, player2Score, elapsedTime, isMultiplayer, userProfile, player2Profile } = useGameContext();

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-120px)] bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="lg:w-1/3 p-4 md:p-6 bg-gray-50">
        <Card className="mb-4 md:mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Game Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <Trophy className="h-5 w-5 text-yellow-500 mr-2" />
                <span className="text-indigo-600 font-semibold">{score}</span>
              </div>
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-purple-500 mr-2" />
                <span className="text-purple-600 font-semibold">{formatTime(elapsedTime)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Question 
          question={currentQuestion.question}
          options={currentQuestion.options}
        />
        <div className="mt-4 text-xl font-bold">Time left: {questionTimer}s</div>
      </div>
      <div className="lg:w-2/3 p-4 md:p-6 h-[50vh] lg:h-auto">
        <Grid
          options={currentQuestion.options}
          correctAnswer={currentQuestion.correctLetter}
          onCorrectAnswer={handleCorrectAnswer}
          onWrongAnswer={handleWrongAnswer}
          elapsedTime={elapsedTime}
        />
      </div>
      {isMultiplayer && (
        <div className="lg:w-1/4 p-4 bg-gray-100">
          <h3 className="text-xl font-bold mb-4">Scoreboard</h3>
          <p className="mb-2">{userProfile.username}: {score}</p>
          <p>{player2Profile?.username || 'Opponent'}: {player2Score}</p>
        </div>
      )}
    </div>
  );
};

export default GameScreen;