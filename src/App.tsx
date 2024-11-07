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
  const [selectedAdventure, setSelectedAdventure] = useState('');
  const [userProfile, setUserProfile] = useState<UserProfile>();
  const [showAdventureSelection, setShowAdventureSelection] = useState(true);

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

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Header
        userProfile={userProfile}
        showAdventureSelection={showAdventureSelection}
        selectedAdventure={selectedAdventure}
        onChangeAdventure={() => setShowAdventureSelection(true)}
        onSignOut={signOut}
      />
      <main className="flex-grow container mx-auto px-4 py-8">
        {showAdventureSelection ? (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <AdventureSelection
              userProfile={userProfile}
              onAdventureSelect={(adventure) => {
                setSelectedAdventure(adventure);
                setShowAdventureSelection(false);
              }}
            />
          </div>
        ) : (
          selectedAdventure && <Game adventure={selectedAdventure} userProfile={userProfile!} />
        )}
      </main>
    </div>
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
              <Route path="/game" element={<ProtectedRoute><AuthenticatedApp /></ProtectedRoute>} />
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
