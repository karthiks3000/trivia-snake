import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Adventure } from '../interface';
import Header from './Header';
import AdventureSelection from './AdventureSelection';
import { useGameContext } from './GameContext';

const AdventureSelectionPage: React.FC = () => {
  const [selectedAdventure, setSelectedAdventure] = useState<Adventure | null>(null);
  const navigate = useNavigate();
  const { userProfile } = useGameContext();

  const handleAdventureSelect = (adventure: Adventure) => {
    setSelectedAdventure(adventure);
    navigate('/game-mode', { state: { adventure: adventure } });
  };

  const handleChangeAdventure = () => {
    setSelectedAdventure(null);
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
        selectedAdventure={selectedAdventure}
        onChangeAdventure={handleChangeAdventure}
        onShowLeaderboard={handleShowLeaderboard}
        onSignOut={handleSignOut}
      />
      <main className="container mx-auto px-4 py-8">
        <AdventureSelection
          userProfile={userProfile}
          onAdventureSelect={handleAdventureSelect}
        />
      </main>
    </div>
  );
};

export default AdventureSelectionPage;