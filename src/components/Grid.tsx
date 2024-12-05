import React, { useState, useEffect, useCallback, useRef, forwardRef, useImperativeHandle } from 'react';
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
  correctLetter: string; 
  onCorrectAnswer: () => void;
  onWrongAnswer: () => void;
  elapsedTime?: number;
  isPaused?: boolean;
}


const Grid = forwardRef<any, GridProps>(({ 
  options,
  correctLetter,
  onCorrectAnswer, 
  onWrongAnswer, 
  isPaused = false
}, ref) => {
  const [foods, setFoods] = useState<Array<{ position: number[], letter: string }>>([]);
  const hasCollidedRef = useRef(false);
  const snakeRef = useRef<any>(null);
  const [shouldShrink, setShouldShrink] = useState(false);

  
  // Add state to track collision results
  const [collisionResult, setCollisionResult] = useState<{
    type: 'correct' | 'wrong' | null;
    food?: { position: number[], letter: string };
  }>({ type: null });

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    pauseGame: () => {
      if (snakeRef.current) {
        snakeRef.current.pause();
      }
    },
    resumeGame: () => {
      if (snakeRef.current) {
        snakeRef.current.resume();
      }
    },
    getSnakePosition: () => {
      return snakeRef.current?.getSnake() || [];
    },
    resetSnake: () => {
      if (snakeRef.current) {
        snakeRef.current.resetPosition(); // This method needs to be implemented in Snake component
        hasCollidedRef.current = false; // Reset collision state
        setCollisionResult({ type: null }); // Reset collision result
      }
    }
  }));
  
  
  // Generate a random position for food
  const getRandomPosition = useCallback(() => {
    return [
      Math.floor(Math.random() * 20) * 5,
      Math.floor(Math.random() * 20) * 5,
    ];
  }, []);

  useEffect(() => {
    const letters = options.map((_, index) => String.fromCharCode(65 + index)); // A, B, C, D...
    const newFoods = letters.map((letter, index) => ({
      position: getRandomPosition(),
      letter: letter // Use letter instead of full option text
    }));
    setFoods(newFoods);
    hasCollidedRef.current = false;
  }, [options, getRandomPosition]);

  // Check collision with walls, self, and food
  const checkCollision = useCallback((head: number[]) => {
    if (hasCollidedRef.current) return false;
    
    // Check wall collision
    if (head[0] >= 100 || head[0] < 0 || head[1] >= 100 || head[1] < 0) {
      hasCollidedRef.current = true;
      setCollisionResult({ type: 'wrong' });
      return true;
    }

    // Check self collision using current snake position
    const currentSnake = snakeRef.current?.getSnake() || [];
    for (let i = 1; i < currentSnake.length; i++) {
      if (head[0] === currentSnake[i][0] && head[1] === currentSnake[i][1]) {
        hasCollidedRef.current = true;
        setCollisionResult({ type: 'wrong' });
        return true;
      }
    }

    // Check food collision
    for (let food of foods) {
      if (Math.abs(head[0] - food.position[0]) < 5 && Math.abs(head[1] - food.position[1]) < 5) {
        hasCollidedRef.current = true;
        
        if (food.letter === correctLetter) {
          setShouldShrink(true);
          setCollisionResult({ type: 'correct', food });
          // Reset shrink flag after a short delay
          setTimeout(() => setShouldShrink(false), 100);
        } else {
          setCollisionResult({ type: 'wrong', food });
        }
        return true;
      }
    }

    return false;
  }, [foods, options, correctLetter]);

  // Handle collision results
  useEffect(() => {
    if (collisionResult.type === 'correct') {
      onCorrectAnswer();
      setFoods(prevFoods => prevFoods.filter(f => f !== collisionResult.food));
    } else if (collisionResult.type === 'wrong') {
      onWrongAnswer();
      if (collisionResult.food) {
        setFoods(prevFoods => prevFoods.filter(f => f !== collisionResult.food));
      }
    }
    
    // Reset collision result after handling
    if (collisionResult.type) {
      setCollisionResult({ type: null });
    }
  }, [collisionResult, onCorrectAnswer, onWrongAnswer]);


  return (
    <GridContainer>
      <Snake
        ref={snakeRef}
        onCollision={checkCollision}
        isPaused={isPaused}
        shouldShrink={shouldShrink}
      />
      {foods.map((food, index) => (
        
        <Food
          key={index}
          position={food.position}
          letter={food.letter}
        />
      ))}
    </GridContainer>
  );
});

Grid.displayName = 'Grid';

export default Grid;
