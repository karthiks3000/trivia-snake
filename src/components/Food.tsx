import React from 'react';

interface FoodProps {
  position: number[];
  letter: string;
}

const Food: React.FC<FoodProps> = ({ position, letter }) => {
  return (
    <div
      className="absolute w-[5%] h-[5%] bg-red-500 rounded-full flex items-center justify-center text-white font-bold"
      style={{ left: `${position[0]}%`, top: `${position[1]}%` }}
    >
      {letter}
    </div>
  );
};

export default Food;
