import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Adventure } from '../interface';
import { useGameContext } from './GameContext';

const GameModePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const adventure = location.state?.adventure as Adventure;
  const { userProfile, setIsMultiplayer } = useGameContext();

  const handleSinglePlayer = () => {
    setIsMultiplayer(false);
    navigate('/game', { state: { adventure, mode: 'single' } });
  };

  const handleMultiplayer = () => {
    setIsMultiplayer(true);
    navigate('/multiplayer-lobby', { state: { adventure } });
  };

  const handleChangeAdventure = () => {
    navigate('/adventure-selection');
  };

  const handleShowLeaderboard = () => {
    // TODO: Implement leaderboard navigation
    console.log("Show leaderboard");
  };

  const handleSignOut = () => {
    // TODO: Implement sign out functionality
    console.log("Sign out");
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header 
        showAdventureSelection={true}
        selectedAdventure={adventure}
        onChangeAdventure={handleChangeAdventure}
        onShowLeaderboard={handleShowLeaderboard}
        onSignOut={handleSignOut}
      />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Choose Game Mode</h1>
        <p className="text-lg mb-4">Welcome, {userProfile.username} (ID: {userProfile.userId})</p>
        <div className="flex justify-center space-x-4">
          <button
            onClick={handleSinglePlayer}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Single Player
          </button>
          <button
            onClick={handleMultiplayer}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            Multiplayer
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameModePage;