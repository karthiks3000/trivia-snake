import React from 'react';
import Game from './components/Game';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col">
      <h1 className="text-4xl font-bold text-center text-gray-900 mb-8">Trivia Snake Game</h1>
      <div className="flex-grow container mx-auto px-4">
        <Game />
      </div>
    </div>
  );
};

export default App;
