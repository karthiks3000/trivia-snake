import { useEffect, useState } from 'react';
import { fetchUserAttributes } from 'aws-amplify/auth';
import { Authenticator, ThemeProvider, Theme, View, useAuthenticator } from '@aws-amplify/ui-react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import '@aws-amplify/ui-react/styles.css';
import Game from './components/Game';
import AdventureSelection from './components/AdventureSelection';
import './aws-config';
import Header from './components/Header';
import LandingPage from './components/LandingPage';
import LeaderboardPage from './components/LeaderboardPage';
import { useNavigate } from 'react-router-dom';
import MultiplayerLobby from './components/MultiplayerLobby';
import { WebSocketProvider } from './WebSocketContext';

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

export interface UserProfile {
  username: string;
  userId: string;
}



function AuthenticatedApp() {
  const { signOut } = useAuthenticator((context) => [context.user]);
  const [userProfile, setUserProfile] = useState<UserProfile>();
  const navigate = useNavigate();


  useEffect(() => {
    async function fetchUsername() {
      try {
        const userAttributes = await fetchUserAttributes();
        setUserProfile({
          userId: userAttributes.sub!,
          username: userAttributes.preferred_username!
        });
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    }
    fetchUsername();
  }, []);

  const handleSignOut = () => {
    signOut();
    navigate('/');
  };

  if (!userProfile) {
    return <div>Loading...</div>;
  }

  return (
    <WebSocketProvider userProfile={userProfile!}>
      <div className="flex flex-col min-h-screen bg-gray-100">
        <Header userProfile={userProfile} onSignOut={handleSignOut} />
        <main className="flex-grow container mx-auto px-4 py-8">
          <Routes>
            <Route path="leaderboard" element={<LeaderboardPage />} />
            <Route path="adventure-selection" element={<AdventureSelection userProfile={userProfile} />} />
            <Route path=":adventureId" element={<Game userProfile={userProfile!} />} />
            <Route path="/" element={<Navigate to="/game/adventure-selection" replace />} />
            <Route path="multiplayer/:adventureId" element={<MultiplayerLobby userProfile={userProfile!} />} />

          </Routes>
        </main>
      </div>
    </WebSocketProvider>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <Authenticator.Provider>
        <Router>
          <div className="min-h-screen bg-gray-100">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/signin" element={<AuthFlow />} />
              <Route path="/game/*" element={<ProtectedRoute> <AuthenticatedApp /></ProtectedRoute>} />
            </Routes>
          </div>
        </Router>
      </Authenticator.Provider>
    </ThemeProvider>
  );
}

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
        <>{user ? <Navigate to="/game" replace /> : null}</>
      )}
    </Authenticator>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuthenticator((context) => [context.user]);
  
  if (!user) {
    return <Navigate to="/signin" replace />;
  }
  
  return <>{children}</>;
}

export default App;
