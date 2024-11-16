import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { useGameContext } from './GameContext';
import Question from './Question';
import Grid from './Grid';
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";
import { Clock, Trophy } from 'lucide-react';
import { formatTime } from '../lib/utils';
import { Adventure } from './AdventureSelection';


export interface GameScreenHandle {
  pauseGame: () => void;
  resumeGame: () => void;
  resetGrid: () => void;
}

interface GameScreenProps {
  adventure: Adventure;
  currentQuestionIndex: number;
  handleCorrectAnswer: () => void;
  handleWrongAnswer: () => void;
}

const GameScreen = forwardRef<GameScreenHandle, GameScreenProps>(({ 
  adventure,
  currentQuestionIndex,
  handleCorrectAnswer,
  handleWrongAnswer,
}, ref) => {
  const { score, elapsedTime } = useGameContext();
  const [options, setOptions] = useState<string[]>([]);
  const [correctLetter, setCorrectLetter] = useState<string>('');
  const [currentQuestion, setCurrentQuestion] = useState<string>('');
  const gridRef = useRef<any>(null);

  useEffect(() => {
    if (adventure && currentQuestionIndex < adventure.questions.length) {
      const questionItem = adventure.questions[currentQuestionIndex];
      const shuffledOptions = [...questionItem.options].sort(() => Math.random() - 0.5);
      const correctAnswerIndex = shuffledOptions.findIndex(option => option === questionItem.correctAnswer);
      setCurrentQuestion(questionItem.question);
      setOptions(shuffledOptions);
      setCorrectLetter(String.fromCharCode(65 + correctAnswerIndex));
    }
  }, [adventure, currentQuestionIndex]);

  const resetGrid = () => {
    if (gridRef.current) {
      gridRef.current.resetSnake();
      gridRef.current.resumeGame();
    }
  };

  const pauseGame = () => {
    if (gridRef.current) {
      gridRef.current.pauseGame();
    }
  };

  const resumeGame = () => {
    if (gridRef.current) {
      gridRef.current.resumeGame();
    }
  };

  useImperativeHandle(ref, () => ({
    pauseGame,
    resumeGame,
    resetGrid
  }));

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
          question={currentQuestion}
          options={options}
        />
      </div>
      <div className="lg:w-2/3 p-4 md:p-6 h-[50vh] lg:h-auto">
        <Grid
          ref={gridRef}
          options={options}
          correctLetter={correctLetter}
          onCorrectAnswer={handleCorrectAnswer}
          onWrongAnswer={handleWrongAnswer}
          elapsedTime={elapsedTime}
        />
      </div>
    </div>
  );
});
GameScreen.displayName = 'GameScreen';


export default GameScreen;