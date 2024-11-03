import React from 'react';
import { useGameContext } from './GameContext';
import Question from './Question';
import Grid from './Grid';

const GameScreen: React.FC<{
  currentQuestion: any,
  handleCorrectAnswer: () => void,
  handleWrongAnswer: () => void,
}> = ({ currentQuestion, handleCorrectAnswer, handleWrongAnswer }) => {
  const { score, elapsedTime, formatTime } = useGameContext();

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-120px)]">
      <div className="md:w-1/3 p-4">
        <div className="mb-4 flex justify-between text-lg">
          <span>Score: {score}</span>
          <span>Time: {formatTime(elapsedTime)}</span>
        </div>
        <Question 
          question={currentQuestion.question}
          options={currentQuestion.options}
        />
      </div>
      <div className="md:w-2/3 p-4">
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