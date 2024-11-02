import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import Snake from './Snake';
import Food from './Food';

const GridContainer = styled.div`
  position: relative;
  width: 90%;
  height: 90%;
  aspect-ratio: 1 / 1;
  border: 2px solid #000;
`;

const GridContent = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
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
    const [lastGrowthTime, setLastGrowthTime] = useState(0);
  
    const moveSnake = useCallback(() => {
      const newSnake = [...snake];
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
  
      newSnake.unshift(head);
  
      // Grow snake every 10 seconds
      if (elapsedTime - lastGrowthTime >= 10) {
        setLastGrowthTime(elapsedTime);
      } else {
        newSnake.pop();
      }
  
      setSnake(newSnake);
  
      checkCollision(head);
    }, [snake, direction, elapsedTime, lastGrowthTime]);

  const checkCollision = (head: number[]) => {
    if (
      head[0] >= 100 ||
      head[0] < 0 ||
      head[1] >= 100 ||
      head[1] < 0
    ) {
      onWrongAnswer();
    }

    foods.forEach((food, index) => {
        if (Math.abs(head[0] - food.position[0]) < 5 && Math.abs(head[1] - food.position[1]) < 5) {
          if (food.letter === correctAnswer) {
            onCorrectAnswer();
            // Reduce snake size by 1 on correct answer, but not below 1
            setSnake(prevSnake => prevSnake.length > 1 ? prevSnake.slice(0, -1) : prevSnake);
          } else {
            onWrongAnswer();
          }
          const newFoods = [...foods];
          newFoods.splice(index, 1);
          setFoods(newFoods);
        }
      });
    };

  const getRandomPosition = () => {
    const position = [
      Math.floor(Math.random() * 20) * 5,
      Math.floor(Math.random() * 20) * 5,
    ];
    return position;
  };

  useEffect(() => {
    const newFoods = options.map((_, index) => ({
      position: getRandomPosition(),
      letter: String.fromCharCode(65 + index) // A, B, C, D
    }));
    setFoods(newFoods);
  }, [options]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case 'arrowup':
        case 'w':
          setDirection(prev => prev !== 'DOWN' ? 'UP' : prev);
          break;
        case 'arrowdown':
        case 's':
          setDirection(prev => prev !== 'UP' ? 'DOWN' : prev);
          break;
        case 'arrowleft':
        case 'a':
          setDirection(prev => prev !== 'RIGHT' ? 'LEFT' : prev);
          break;
        case 'arrowright':
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

  return (
    <GridContainer>
      <GridContent>
        <Snake snake={snake} />
        {foods.map((food, index) => (
          <Food key={index} position={food.position} letter={food.letter} />
        ))}
      </GridContent>
    </GridContainer>
  );
};

export default Grid;
