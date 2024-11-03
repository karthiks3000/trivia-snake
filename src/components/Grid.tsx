import React, { useState, useEffect, useCallback, useRef } from 'react';
import styled from 'styled-components';
import Snake from './Snake';
import Food from './Food';

// Styled component for the grid container
const GridContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  border: 20px solid transparent;
  border-image: repeating-linear-gradient(
    45deg,
    #B22222,
    #B22222 10px,
    #8B0000 10px,
    #8B0000 20px
  ) 20;
  background-color: #228B22;
  box-sizing: border-box;

  &::before {
    content: '';
    position: absolute;
    top: -20px;
    left: -20px;
    right: -20px;
    bottom: -20px;
    background: 
      linear-gradient(45deg, rgba(0,0,0,0.1) 25%, transparent 25%, transparent 75%, rgba(0,0,0,0.1) 75%, rgba(0,0,0,0.1)) 0 0 / 40px 40px,
      linear-gradient(45deg, rgba(0,0,0,0.1) 25%, transparent 25%, transparent 75%, rgba(0,0,0,0.1) 75%, rgba(0,0,0,0.1)) 20px 20px / 40px 40px;
    z-index: -1;
  }
`;

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