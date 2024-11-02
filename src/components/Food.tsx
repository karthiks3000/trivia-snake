import React from 'react';
import styled from 'styled-components';

const FoodItem = styled.div`
  position: absolute;
  width: 5%;
  height: 5%;
  background-color: #f44336;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: bold;
  color: #fff;
  border-radius: 50%;
  font-size: 2vw;

  @media (min-width: 768px) {
    font-size: 1.5vw;
  }
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
