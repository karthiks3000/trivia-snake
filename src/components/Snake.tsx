import React from 'react';

interface SnakeProps {
  snake: number[][];
}

const Snake: React.FC<SnakeProps> = ({ snake }) => {
  return (
    <>
      {snake.map((segment, index) => (
        <div
          key={index}
          className={`absolute w-[5%] h-[5%] ${
            index === 0 ? 'bg-green-600 rounded-full' : 'bg-green-500 rounded-full'
          }`}
          style={{
            left: `${segment[0]}%`,
            top: `${segment[1]}%`,
            zIndex: snake.length - index,
          }}
        >
          {index === 0 && (
            <>
              <div className="absolute w-[20%] h-[20%] bg-black rounded-full top-[20%] left-[20%]" />
              <div className="absolute w-[20%] h-[20%] bg-black rounded-full top-[20%] right-[20%]" />
            </>
          )}
        </div>
      ))}
    </>
  );
};

export default Snake;
