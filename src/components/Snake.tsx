import React, { useState, useEffect, forwardRef, useImperativeHandle, useCallback, useRef } from 'react';

const getSegmentRotation = (index: number, segment: number[], snake: number[][]): string => {
  if (index === 0) {
    // For head segment, calculate based on movement direction
    const nextSegment = snake[1];
    if (!nextSegment) return '0deg';
    
    const dx = segment[0] - nextSegment[0];
    const dy = segment[1] - nextSegment[1];
    
    if (dx > 0) return '0deg';
    if (dx < 0) return '180deg';
    if (dy > 0) return '270deg';
    return '90deg';
  }
  
  // For body segments, calculate based on previous and next segments
  const prevSegment = snake[index - 1];
  const nextSegment = snake[index + 1] || segment;
  
  const dx = prevSegment[0] - nextSegment[0];
  const dy = prevSegment[1] - nextSegment[1];
  
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  return `${angle}deg`;
};
const styles = `
  @keyframes blink {
    0%, 90%, 100% { transform: scaleY(1); }
    95% { transform: scaleY(0.1); }
  }
`;

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
      <style>{styles}</style>
      {snake.map((segment, index) => (
        <div
          key={index}
          className={`absolute w-[5%] h-[5%] box-border ${
            index === 0
              ? 'bg-orange-500 rounded-[50%_50%_50%_50%_/_60%_60%_40%_40%] shadow-lg'
              : 'bg-orange-400 rounded-full shadow-md'
          } border-2 border-orange-700 transition-all duration-150`}
          style={{
            left: `${segment[0]}%`,
            top: `${segment[1]}%`,
            zIndex: snake.length - index,
            transition: isMoving ? `all ${0.15 + index * 0.01}s cubic-bezier(0.34, 1.56, 0.64, 1)` : 'none',
            willChange: 'transform',
            transformOrigin: 'center center',
            transform: `
              rotate(${getSegmentRotation(index, segment, snake)})
              ${index === 0 ? 'translateZ(0) scale(1.1)' : `scale(${1 - index * 0.01})`}
              ${index > 0 ? `translate(${Math.sin(Date.now() * 0.003 + index) * 0.5}px, ${Math.cos(Date.now() * 0.002 + index) * 0.5}px)` : ''}
            `,
            filter: `brightness(${index === 0 ? '1.1' : 1 - index * 0.01})`
          }}
        >
          {index === 0 && (
            <>
              <div className="absolute w-[20%] h-[20%] bg-white rounded-full border border-black top-[20%] left-[20%] shadow-inner transition-transform duration-300"
                style={{ animation: 'blink 4s infinite', transformOrigin: 'center' }} />
              <div className="absolute w-[20%] h-[20%] bg-white rounded-full border border-black top-[20%] right-[20%] shadow-inner transition-transform duration-300"
                style={{ animation: 'blink 4s infinite', transformOrigin: 'center' }} />
            </>
          )}
        </div>
      ))}
    </>
  );
});

Snake.displayName = 'Snake';

export default Snake;
