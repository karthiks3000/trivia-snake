import React from 'react';
import styled from 'styled-components';

const FoodItem = styled.div`
  position: absolute;
  width: 5%;
  height: 5%;
  background-color: #FFD700; // Gold
  border: 2px solid #B8860B; // DarkGoldenRod
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: #000000; // Black text
  font-size: 16px;
`;

interface FoodProps {
  position: number[];
  letter: string;
}

const Food: React.FC<FoodProps> = ({ position, letter }) => {
  return (
    <FoodItem style={{ left: `${position[0]}%`, top: `${position[1]}%` }}>
      {letter}
    </FoodItem>
  );
};

export default Food;
