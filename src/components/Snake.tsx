import React, { useState, useEffect, forwardRef, useImperativeHandle, useCallback, useRef } from 'react';

interface SnakeProps {
  onCollision: (head: number[]) => boolean;
  isPaused?: boolean;
  speed?: number;
  shouldShrink?: boolean;
}

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

const Snake = forwardRef<any, SnakeProps>(({ 
  onCollision, 
  isPaused = false,
  speed = 100,
  shouldShrink = false
}, ref) => {
  const [snake, setSnake] = useState<number[][]>([[0, 0]]);
  const [direction, setDirection] = useState<Direction>('RIGHT');
  const [isMoving, setIsMoving] = useState(!isPaused);
  const lastGrowthTimeRef = useRef<number>(Date.now());
  const moveTimeoutRef = useRef<NodeJS.Timeout>();

  // Handle shrinking when correct answer is given
  useEffect(() => {
    if (shouldShrink && snake.length > 1) {
      setSnake(prevSnake => prevSnake.slice(0, -1));
    }
  }, [shouldShrink]);

  const resetPosition = () => {
    // Get current length of snake to maintain it
    const currentLength = snake.length;
    
    // Create new snake array with same length but reset position
    const newSnake = Array.from({ length: currentLength }, (_, index) => {
      // Start at center (50, 50) and extend leftward
      return [50 - (index * 5), 50];
    });
    
    setSnake(newSnake);
    setDirection('RIGHT'); // Use string literal instead of array
  };

  useImperativeHandle(ref, () => ({
    pause: () => setIsMoving(false),
    resume: () => setIsMoving(true),
    getSnake: () => snake,
    getDirection: () => direction,
    resetPosition
  }));

  useEffect(() => {
    setIsMoving(!isPaused);
  }, [isPaused]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isMoving) return;

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
  }, [isMoving]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const calculateNewHead = useCallback((currentHead: number[], currentDirection: Direction): number[] => {
    const newHead = [...currentHead];
    switch (currentDirection) {
      case 'UP':
        newHead[1] -= 5;
        break;
      case 'DOWN':
        newHead[1] += 5;
        break;
      case 'LEFT':
        newHead[0] -= 5;
        break;
      case 'RIGHT':
        newHead[0] += 5;
        break;
    }
    return newHead;
  }, []);

  const moveSnake = useCallback(() => {
    const currentTime = Date.now();
    const shouldGrow = currentTime - lastGrowthTimeRef.current >= 3000;

    setSnake(prevSnake => {
      const head = [...prevSnake[0]];
      const newHead = calculateNewHead(head, direction);
      
      if (onCollision(newHead)) {
        return prevSnake;
      }

      if (shouldGrow) {
        lastGrowthTimeRef.current = currentTime;
        return [newHead, ...prevSnake];
      }

      return [newHead, ...prevSnake.slice(0, -1)];
    });
  }, [direction, onCollision, calculateNewHead]);

  // Handle movement interval
  useEffect(() => {
    if (!isMoving) {
      if (moveTimeoutRef.current) {
        clearInterval(moveTimeoutRef.current);
      }
      return;
    }

    moveTimeoutRef.current = setInterval(moveSnake, speed);
    return () => {
      if (moveTimeoutRef.current) {
        clearInterval(moveTimeoutRef.current);
      }
    };
  }, [isMoving, moveSnake, speed]);

  return (
    <>
      {snake.map((segment, index) => (
        <div
          key={index}
          className={`absolute w-[5%] h-[5%] box-border ${
            index === 0
              ? 'bg-orange-500 rounded-[50%_50%_50%_50%_/_60%_60%_40%_40%]'
              : 'bg-orange-400 rounded-full'
          } border border-orange-600`}
          style={{
            left: `${segment[0]}%`,
            top: `${segment[1]}%`,
            zIndex: snake.length - index,
            transition: isMoving ? 'all 0.1s linear' : 'none'
          }}
        >
          {index === 0 && (
            <>
              <div className="absolute w-[20%] h-[20%] bg-white rounded-full border border-black top-[20%] left-[20%]" />
              <div className="absolute w-[20%] h-[20%] bg-white rounded-full border border-black top-[20%] right-[20%]" />
            </>
          )}
        </div>
      ))}
    </>
  );
});

Snake.displayName = 'Snake';

export default Snake;
