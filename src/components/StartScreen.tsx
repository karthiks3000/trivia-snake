import React, { useState } from 'react';

interface StartScreenProps {
  onStart: (username: string, adventure: string) => void;
}

const StartScreen: React.FC<StartScreenProps> = ({ onStart }) => {
  const [username, setUsername] = useState('');
  const [selectedAdventure, setSelectedAdventure] = useState('');

  const handleStart = () => {
    if (username.trim() && selectedAdventure) {
      onStart(username.trim(), selectedAdventure);
    }
  };

  return (
    <div className="text-center">
      <h2 className="text-2xl font-bold mb-4">Enter your username and choose an adventure</h2>
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Username"
        className="border p-2 mb-4 w-full max-w-xs"
      />
      <select
        value={selectedAdventure}
        onChange={(e) => setSelectedAdventure(e.target.value)}
        className="border p-2 mb-4 w-full max-w-xs"
      >
        <option value="">Select an adventure</option>
        <option value="history">History</option>
        <option value="science">Science</option>
      </select>
      <button 
        onClick={handleStart}
        className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
        disabled={!username.trim() || !selectedAdventure}
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
