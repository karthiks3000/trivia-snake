import React, { useState, useEffect, useCallback, useRef } from 'react';
import Snake from './Snake';
import Food from './Food';

const GridContainer: React.FC<React.PropsWithChildren<{}>> = ({ children }) => (
  <div className="relative w-full h-full bg-green-600 border-4 md:border-8 border-red-700 rounded-lg overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-green-700" />
    <div className="absolute inset-0 opacity-10 bg-[linear-gradient(45deg,#000_25%,transparent_25%,transparent_75%,#000_75%,#000)_0_0/20px_20px,linear-gradient(45deg,#000_25%,transparent_25%,transparent_75%,#000_75%,#000)_10px_10px/20px_20px] md:bg-[linear-gradient(45deg,#000_25%,transparent_25%,transparent_75%,#000_75%,#000)_0_0/40px_40px,linear-gradient(45deg,#000_25%,transparent_25%,transparent_75%,#000_75%,#000)_20px_20px/40px_40px]" />
    <div className="relative z-10 w-full h-full">
      {children}
    </div>
  </div>
);

interface GridProps {
  options: string[];
  correctAnswer: string;
  onCorrectAnswer: () => void;
  onWrongAnswer: () => void;
  elapsedTime: number;
}

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

const Grid: React.FC<GridProps> = ({ 
  options, 
  correctAnswer, 
  onCorrectAnswer, 
  onWrongAnswer, 
  elapsedTime 
}) => {
  // State declarations
  const [snake, setSnake] = useState<number[][]>([[0, 0]]);
  const [foods, setFoods] = useState<Array<{ position: number[], letter: string }>>([]);
  const [direction, setDirection] = useState<Direction>('RIGHT');
  const [lastGrowthTime, setLastGrowthTime] = useState(0);
  const [lastCorrectAnswerTime, setLastCorrectAnswerTime] = useState(0);
  const hasCollidedRef = useRef(false);
  
  // Generate a random position for food
  const getRandomPosition = useCallback(() => {
    return [
      Math.floor(Math.random() * 20) * 5,
      Math.floor(Math.random() * 20) * 5,
    ];
  }, []);

  // Check for collisions with walls or food
  const checkCollision = (head: number[]) => {
    if (hasCollidedRef.current) return false; // Prevent multiple collisions in the same frame
    
    // Check wall collision
    if (head[0] >= 100 || head[0] < 0 || head[1] >= 100 || head[1] < 0) {
      hasCollidedRef.current = true;
      onWrongAnswer();
      return true;
    }

    // Check self collision
    for (let i = 1; i < snake.length; i++) {
      if (head[0] === snake[i][0] && head[1] === snake[i][1]) {
        hasCollidedRef.current = true;
        onWrongAnswer();
        return true;
      }
    }

    // Check food collision
    for (let food of foods) {
      if (Math.abs(head[0] - food.position[0]) < 5 && Math.abs(head[1] - food.position[1]) < 5) {
        if (food.letter === correctAnswer) {
          hasCollidedRef.current = true;
          
          onCorrectAnswer();
          // Decrease snake length by 1, but ensure it doesn't go below 1
          setSnake(prevSnake => prevSnake.length > 1 ? prevSnake.slice(0, -1) : prevSnake);
          
        } else {
          hasCollidedRef.current = true;
          onWrongAnswer();
        }
        setFoods(prevFoods => prevFoods.filter(f => f !== food));
        return true;
      }
    }

    return false;
  };

  // Move the snake
  const moveSnake = useCallback(() => {
    hasCollidedRef.current = false; // Reset collision flag at the start of each move
    setSnake(prevSnake => {
      const newSnake = [...prevSnake];
      const head = [...newSnake[0]];

      switch (direction) {
        case 'RIGHT': head[0] += 5; break;
        case 'LEFT': head[0] -= 5; break;
        case 'UP': head[1] -= 5; break;
        case 'DOWN': head[1] += 5; break;
      }
      newSnake.unshift(head);

      if (elapsedTime - lastGrowthTime >= 3) {
        setLastGrowthTime(elapsedTime);
      } else {
        newSnake.pop();
      }

      if (checkCollision(head)) {
        return prevSnake; // Return the previous state if collision occurred
      }
      return newSnake;
    });
  }, [direction, elapsedTime, lastGrowthTime, checkCollision]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const keyDirections: { [key: string]: Direction } = {
        'ArrowUp': 'UP', 'w': 'UP',
        'ArrowDown': 'DOWN', 's': 'DOWN',
        'ArrowLeft': 'LEFT', 'a': 'LEFT',
        'ArrowRight': 'RIGHT', 'd': 'RIGHT'
      };

      const newDirection = keyDirections[e.key];
      if (newDirection) {
        setDirection(prev => {
          const opposites: { [K in Direction]: Direction } = {
            'UP': 'DOWN', 'DOWN': 'UP', 'LEFT': 'RIGHT', 'RIGHT': 'LEFT'
          };
          return opposites[prev] !== newDirection ? newDirection : prev;
        });
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    const gameInterval = setInterval(moveSnake, 100);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      clearInterval(gameInterval);
    };
  }, [moveSnake]);

  useEffect(() => {
    const newFoods = options.map((_, index) => ({
      position: getRandomPosition(),
      letter: String.fromCharCode(65 + index)
    }));
    setFoods(newFoods);
  }, [options, getRandomPosition]);

  return (
    <GridContainer>
      <Snake snake={snake} />
      {foods.map((food, index) => (
        <Food key={index} position={food.position} letter={food.letter} />
      ))}
    </GridContainer>
  );
};

export default Grid;