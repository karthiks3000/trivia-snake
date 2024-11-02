import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import Snake from './Snake';
import Food from './Food';

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
  score: number;
  elapsedTime: number;
}

const Grid: React.FC<GridProps> = ({ options, correctAnswer, onCorrectAnswer, onWrongAnswer, score, elapsedTime }) => {
  const [snake, setSnake] = useState<number[][]>([[0, 0]]);
  const [foods, setFoods] = useState<Array<{ position: number[], letter: string }>>([]);
  const [direction, setDirection] = useState<string>('RIGHT');

  const getRandomPosition = useCallback(() => {
    const position = [
      Math.floor(Math.random() * 20) * 5,
      Math.floor(Math.random() * 20) * 5,
    ];
    return position;
  }, []);

  const checkCollision = useCallback((head: number[]) => {
    if (
      head[0] >= 100 ||
      head[0] < 0 ||
      head[1] >= 100 ||
      head[1] < 0
    ) {
      onWrongAnswer();
      return true;
    }

    for (let food of foods) {
      if (Math.abs(head[0] - food.position[0]) < 5 && Math.abs(head[1] - food.position[1]) < 5) {
        if (food.letter === correctAnswer) {
          onCorrectAnswer();
        } else {
          onWrongAnswer();
        }
        setFoods(prevFoods => prevFoods.filter(f => f !== food));
        return true;
      }
    }

    return false;
  }, [foods, correctAnswer, onCorrectAnswer, onWrongAnswer]);

  const moveSnake = useCallback(() => {
    setSnake(prevSnake => {
      const newSnake = [...prevSnake];
      const head = [...newSnake[0]];

      switch (direction) {
        case 'RIGHT':
          head[0] += 5;
          break;
        case 'LEFT':
          head[0] -= 5;
          break;
        case 'UP':
          head[1] -= 5;
          break;
        case 'DOWN':
          head[1] += 5;
          break;
      }

      if (checkCollision(head)) {
        return prevSnake;
      }

      newSnake.unshift(head);
      newSnake.pop();
      return newSnake;
    });
  }, [direction, checkCollision]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
          setDirection(prev => prev !== 'DOWN' ? 'UP' : prev);
          break;
        case 'ArrowDown':
        case 's':
          setDirection(prev => prev !== 'UP' ? 'DOWN' : prev);
          break;
        case 'ArrowLeft':
        case 'a':
          setDirection(prev => prev !== 'RIGHT' ? 'LEFT' : prev);
          break;
        case 'ArrowRight':
        case 'd':
          setDirection(prev => prev !== 'LEFT' ? 'RIGHT' : prev);
          break;
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
