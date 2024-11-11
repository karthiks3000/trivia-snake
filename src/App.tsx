import React, { useState } from 'react';
import { Authenticator, ThemeProvider, Theme, View, useAuthenticator } from '@aws-amplify/ui-react';
import { BrowserRouter as Router, Route, Routes, Navigate, useNavigate, useLocation } from 'react-router-dom';

import '@aws-amplify/ui-react/styles.css';
import './aws-config';
import AdventureSelectionPage from './components/AdventureSelectionPage';
import GameModePage from './components/GameModePage';
import LandingPage from './components/LandingPage';
import SinglePlayerGame from './components/SinglePlayerGame';
import { GameProvider } from './components/GameContext';
import { UserProfile, Adventure } from './interface';
import Header from './components/Header';

const theme: Theme = {
  name: 'custom-theme',
  tokens: {
    colors: {
      brand: {
        primary: {
          10: '#4F46E5',
          80: '#4F46E5',
          90: '#4338CA',
          100: '#3730A3',
        },
      },
    },
    components: {
      button: {
        primary: {
          backgroundColor: '{colors.brand.primary.80}',
          color: '{colors.white}',
          borderColor: '{colors.brand.primary.80}',
          _hover: {
            backgroundColor: '{colors.brand.primary.90}',
            color: '{colors.white}',
          },
          _focus: {
            backgroundColor: '{colors.brand.primary.90}',
            color: '{colors.white}',
          },
          _active: {
            backgroundColor: '{colors.brand.primary.100}',
            color: '{colors.white}',
          },
        },
      },
    },
  },
};

const AuthenticatedRoute: React.FC<{ element: React.ReactElement }> = ({ element }) => {
  const { user } = useAuthenticator((context) => [context.user]);
  
  if (!user) {
    return <Navigate to="/signin" replace />;
  }
  
  const userProfile: UserProfile = {
    userId: user.userId,
    username: user.username
  };

  return (
    <GameProvider userProfile={userProfile}>
      {element}
    </GameProvider>
  );
};

function AuthFlow() {
  return (
    <Authenticator
      components={{
        Header() {
          return (
            <View textAlign="center" padding={4}>
              <h2 className="text-2xl font-bold mb-4">Welcome to Trivia Snake</h2>
            </View>
          );
        },
        Footer() {
          return (
            <View textAlign="center" padding={4}>
              <p className="text-sm text-gray-600">© 2024 Trivia Snake. All rights reserved.</p>
            </View>
          );
        },
      }}
    >
      {({ user }) => (
        <>{user ? <Navigate to="/adventure-selection" replace /> : null}</>
      )}
    </Authenticator>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <Authenticator.Provider>
        <Router>
          <AppContent />
        </Router>
      </Authenticator.Provider>
    </ThemeProvider>
  );
}

function AppContent() {
  const [selectedAdventure, setSelectedAdventure] = useState<Adventure | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthenticator((context) => [context.user]);

  const handleChangeAdventure = () => {
    setSelectedAdventure(null);
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

  const showHeader = user && location.pathname !== '/' && location.pathname !== '/signin';

  return (
    <div className="min-h-screen bg-gray-100">
      {showHeader && (
        <Header 
          showAdventureSelection={true}
          selectedAdventure={selectedAdventure}
          onChangeAdventure={handleChangeAdventure}
          onShowLeaderboard={handleShowLeaderboard}
          onSignOut={handleSignOut}
        />
      )}
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/signin" element={<AuthFlow />} />
        <Route 
          path="/adventure-selection" 
          element={
            <AuthenticatedRoute 
              element={
                <AdventureSelectionPage 
                  onAdventureSelect={(adventure: Adventure) => setSelectedAdventure(adventure)}
                />
              } 
            />
          } 
        />
        <Route 
          path="/game-mode" 
          element={
            <AuthenticatedRoute 
              element={
                <GameModePage 
                  selectedAdventure={selectedAdventure}
                />
              }
            />
          } 
        />
        <Route 
          path="/game" 
          element={
            <AuthenticatedRoute 
              element={
                <SinglePlayerGame 
                  selectedAdventure={selectedAdventure}
                />
              }
            />
          } 
        />
        {/* <Route path="/multiplayer-lobby" element={<AuthenticatedRoute element={<MultiplayerLobby />} />} />
        <Route path="/game/:sessionId" element={<AuthenticatedRoute element={<MultiplayerGame />} />} /> */}
      </Routes>
    </div>
  );
}

export default App;
