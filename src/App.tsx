import { useEffect, useState } from 'react';
import { fetchUserAttributes } from 'aws-amplify/auth';
import { Authenticator, ThemeProvider, Theme, View, Button, useAuthenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import Game from './components/Game';
import './aws-config';

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
  const { user, signOut } = useAuthenticator((context) => [context.user]);
  const [selectedAdventure, setSelectedAdventure] = useState('');
  const [userProfile, setUserProfile] = useState<UserProfile>();

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

  if (selectedAdventure) {
    return (
      <div className="fixed inset-0 bg-gray-100">
        <Game adventure={selectedAdventure} userProfile={userProfile!} />
        <Button
          onClick={() => setSelectedAdventure('')}
          className="absolute top-4 right-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Back to Menu
        </Button>
      </div>
    );
  }

  return (
    <div className="text-center">
      <h1 className="text-2xl font-bold mb-4">Trivia Snake</h1>
      <p className="mb-4">Welcome, {userProfile?.username}!</p>
      <div className="mb-4">
        <label htmlFor="adventure" className="block text-sm font-medium text-gray-700">Select Adventure</label>
        <select
          id="adventure"
          value={selectedAdventure}
          onChange={(e) => setSelectedAdventure(e.target.value)}
          className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          required
        >
          <option value="">Choose an adventure</option>
          <option value="harry_potter">Harry Potter</option>
          <option value="history">History</option>
          <option value="science">Science</option>
        </select>
      </div>
      <Button
        onClick={signOut}
        className="mt-4 w-full bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
      >
        Sign out
      </Button>
    </div>
  );
}

function App() {

  return (
    <ThemeProvider theme={theme}>
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="relative py-3 sm:max-w-xl sm:mx-auto">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-light-blue-500 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>
          <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
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
             {() => <AuthenticatedApp />}
            </Authenticator>
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}

export default App;
