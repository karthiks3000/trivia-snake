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
          className={`absolute w-[5%] h-[5%] box-border ${
            index === 0
              ? 'bg-orange-500 rounded-[50%_50%_50%_50%_/_60%_60%_40%_40%]'
              : 'bg-orange-400 rounded-full'
          } border border-orange-600`}
          style={{
            left: `${segment[0]}%`,
            top: `${segment[1]}%`,
            zIndex: snake.length - index,
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
};

export default Snake;
