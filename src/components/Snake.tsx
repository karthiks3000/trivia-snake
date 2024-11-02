import React from 'react';
import styled from 'styled-components';

const SnakeSegment = styled.div<{ isHead: boolean }>`
  position: absolute;
  width: 5%;
  height: 5%;
  background-color: ${props => props.isHead ? '#2ECC71' : '#4CAF50'};
  border: 1px solid #45a049;
  box-sizing: border-box;
  border-radius: ${props => props.isHead ? '50% 50% 50% 50% / 60% 60% 40% 40%' : '50%'};
`;

const SnakeEye = styled.div`
  position: absolute;
  width: 20%;
  height: 20%;
  background-color: black;
  border-radius: 50%;
`;

interface SnakeProps {
  snake: number[][];
}

const Snake: React.FC<SnakeProps> = ({ snake }) => {
  return (
    <>
      {snake.map((segment, index) => (
        <SnakeSegment
          key={index}
          isHead={index === 0}
          style={{ 
            left: `${segment[0]}%`, 
            top: `${segment[1]}%`,
            zIndex: snake.length - index
          }}
        >
          {index === 0 && (
            <>
              <SnakeEye style={{ top: '20%', left: '20%' }} />
              <SnakeEye style={{ top: '20%', right: '20%' }} />
            </>
          )}
        </SnakeSegment>
      ))}
    </>
  );
};

export default Snake;
