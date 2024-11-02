import React from 'react';
import styled from 'styled-components';
import Game from './components/Game';

const AppContainer = styled.div`
  text-align: center;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
`;

const Title = styled.h1`
  margin-bottom: 30px;
  color: #2196F3;
`;

const App: React.FC = () => {
  return (
    <AppContainer>
      <Title>Trivia Snake Game</Title>
      <Game />
    </AppContainer>
  );
};

export default App;
