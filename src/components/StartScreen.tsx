import React, { useState } from 'react';
import styled from 'styled-components';

const StartContainer = styled.div`
  text-align: center;
  margin-top: 50px;
`;

const Input = styled.input`
  padding: 10px;
  font-size: 16px;
  margin-right: 10px;
`;

const Button = styled.button`
  padding: 10px 20px;
  font-size: 16px;
  background-color: #4CAF50;
  color: white;
  border: none;
  cursor: pointer;

  &:hover {
    background-color: #45a049;
  }
`;

interface StartScreenProps {
  onStart: (username: string) => void;
}

const StartScreen: React.FC<StartScreenProps> = ({ onStart }) => {
  const [username, setUsername] = useState('');

  const handleStart = () => {
    if (username.trim()) {
      onStart(username.trim());
    }
  };

  return (
    <StartContainer>
      <h2>Enter your username to start the game</h2>
      <Input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Username"
      />
      <Button onClick={handleStart}>Start Game</Button>
    </StartContainer>
  );
};

export default StartScreen;
