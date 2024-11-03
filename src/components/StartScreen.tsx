import React, { useState } from 'react';
import axios from 'axios';
import api from '../api';

interface StartScreenProps {
  onStart: (username: string, adventure: string) => void;
  error: string | null;
}

const StartScreen: React.FC<StartScreenProps> = ({ onStart, error }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedAdventure, setSelectedAdventure] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage('');

    try {
      if (isRegistering) {
        const response = await api.registerUser({ username, password });
        if (response.status === 200) {
          setStatusMessage('Registration successful! You can now log in.');
          setIsRegistering(false); // Switch to login screen
          setPassword(''); // Clear password field
        }
      } else {
        const response = await api.loginUser({ username, password });
        if (response.status === 200) {
          setStatusMessage('Login successful!');
          onStart(username, selectedAdventure);
        }
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        if (error.response.status === 400 && error.response.data.error === 'Username already exists') {
          setStatusMessage('Username already exists. Please choose a different username.');
        } else {
          setStatusMessage(error.response.data.error || 'An error occurred');
        }
      } else {
        setStatusMessage('An unexpected error occurred');
      }
    }
  };

  return (
    <div className="flex justify-center items-center h-[calc(100vh-120px)]">
    <div className="relative py-3 sm:max-w-xl sm:mx-auto">
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-light-blue-500 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>
      <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">
            {isRegistering ? 'Register' : 'Login'}
          </h2>
          <form onSubmit={handleAuth} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
            {!isRegistering && (
              <div>
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
            )}
            <button 
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              disabled={!isRegistering && (!username || !password || !selectedAdventure)}
            >
              {isRegistering ? 'Register' : 'Login'}
            </button>
          </form>
          <div className="mt-4 text-center">
            <button 
              onClick={() => {
                setIsRegistering(!isRegistering);
                setStatusMessage('');
                setPassword('');
              }}
              className="text-sm text-indigo-600 hover:text-indigo-500"
            >
              {isRegistering ? 'Already have an account? Login' : 'Need an account? Register'}
            </button>
          </div>
          {statusMessage && <p className="mt-4 text-sm text-center text-red-600">{statusMessage}</p>}
          {error && <p className="mt-4 text-sm text-center text-red-600">{error}</p>}
        </div>
        </div>
        </div>
    </div>
  );
};

export default StartScreen;
