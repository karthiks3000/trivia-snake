// src/api.ts

import axios, { AxiosResponse } from 'axios';
import { LeaderboardEntry } from './components/Leaderboard';

const API_URL = process.env.REACT_APP_API_URL || 'https://your-default-api-url.com';

// Create an axios instance with default config
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Define interfaces for your data structures

interface UserCredentials {
  username: string;
  password: string;
}

// API functions
export const api = {
  // Leaderboard
  getLeaderboard: (): Promise<AxiosResponse<LeaderboardEntry[]>> => 
    apiClient.get('/leaderboard'),

  addScore: (data: LeaderboardEntry): Promise<AxiosResponse<any>> => 
    apiClient.post('/leaderboard', data),

  // User management
  registerUser: (data: UserCredentials): Promise<AxiosResponse<any>> => 
    apiClient.post('/register', data),

  loginUser: (data: UserCredentials): Promise<AxiosResponse<any>> => 
    apiClient.post('/login', data),

  // Add other API calls as needed
};

// Error handling
apiClient.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
    }
    return Promise.reject(error);
  }
);

export default api;
