import React from 'react';
import { useGameContext } from './GameContext';
import Question from './Question';
import Grid from './Grid';
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";
import { Clock, Trophy } from 'lucide-react';
import { formatTime } from '../lib/utils';

const GameScreen: React.FC<{
  currentQuestion: any,
  handleCorrectAnswer: () => void,
  handleWrongAnswer: () => void,
}> = ({ currentQuestion, handleCorrectAnswer, handleWrongAnswer }) => {
  const { score, elapsedTime } = useGameContext();

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
    </div>
  );
};

export default GameScreen;