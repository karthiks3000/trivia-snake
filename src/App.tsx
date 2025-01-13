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
import { motion, AnimatePresence } from 'framer-motion';
import { transition } from './styles/theme';
import { Toaster } from './components/ui/Toaster';

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
      background: {
        primary: '#F3F4F6',
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
      authenticator: {
        router: {
          boxShadow: 'none',
          backgroundColor: 'transparent',
        },
      },
    },
  },
};

export interface UserProfile {
  userId: string;
  username: string;
  // Add any other properties here
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
    return (
      <div className="flex items-center justify-center h-screen">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-2xl font-bold text-indigo-600"
        >
          Loading...
        </motion.div>
      </div>
    );
  }

  return (
    <WebSocketProvider userProfile={userProfile!}>
      <div className="flex flex-col min-h-screen bg-gray-100">
        <Header userProfile={userProfile} onSignOut={handleSignOut} />
        <main className="flex-grow container mx-auto px-4 py-8">
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="leaderboard" element={<LeaderboardPage />} />
              <Route path="adventure-selection" element={<AdventureSelection userProfile={userProfile} />} />
              <Route path=":adventureId" element={<Game userProfile={userProfile!} />} />
              <Route path="/" element={<Navigate to="/game/adventure-selection" replace />} />
              <Route path="multiplayer/:adventureId" element={<MultiplayerLobby userProfile={userProfile!} />} />
            </Routes>
          </AnimatePresence>
        </main>
      </div>
    </WebSocketProvider>
  );
}

function App() {
  const routeVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };

  return (
    <ThemeProvider theme={theme}>
      <Authenticator.Provider>
        <Router>
          <motion.div 
            className="min-h-screen bg-gradient-to-br from-indigo-100 to-purple-100"
            initial="initial"
            animate="animate"
            exit="exit"
            variants={routeVariants}
            transition={transition}
          >
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/signin" element={<AuthFlow />} />
              <Route path="/game/*" element={<ProtectedRoute><AuthenticatedApp /></ProtectedRoute>} />
            </Routes>
          </motion.div>
        </Router>
        <Toaster />
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
              <motion.h2 
                className="text-3xl font-bold mb-4 text-indigo-700"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                Welcome to Trivia Snake
              </motion.h2>
            </View>
          );
        },
        Footer() {
          return (
            <View textAlign="center" padding={4}>
              <motion.p 
                className="text-sm text-gray-600"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                © {new Date().getFullYear()} Trivia Snake. All rights reserved.
              </motion.p>
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