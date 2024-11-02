import React, { useState } from 'react';

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
    <div className="text-center">
      <h2 className="text-2xl font-bold mb-4">Enter your username to start the game</h2>
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Username"
        className="border p-2 mb-4 w-full max-w-xs"
      />
      <button 
        onClick={handleStart}
        className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
      >
        Start Game
      </button>
      <p className="mt-4 text-sm text-gray-600">
        Use arrow keys or WASD to control the snake.
        Eat the correct letter to answer the questions!
      </p>
    </div>
  );
};

export default StartScreen;
