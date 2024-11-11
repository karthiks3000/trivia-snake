// src/api.ts

import axios, { AxiosResponse } from 'axios';
import { LeaderboardEntry } from './components/Leaderboard';
import { fetchAuthSession } from 'aws-amplify/auth';
import { Adventure } from './interface';

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

// Add a request interceptor
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      if (token) {
        config.headers['Authorization'] = `${token}`;
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

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

// API functions
export const api = {

  registerUser: (data: UserCredentials): Promise<AxiosResponse<any>> => 
    apiClient.post('/register', data),

  loginUser: (data: UserCredentials): Promise<AxiosResponse<any>> => 
    apiClient.post('/login', data),
  // Leaderboard
  getLeaderboard: (): Promise<AxiosResponse<LeaderboardEntry[]>> => 
    apiClient.get('/leaderboard'),

  addScore: (data: Omit<LeaderboardEntry, 'username'>): Promise<AxiosResponse<any>> => 
    apiClient.post('/leaderboard', data),

  // Adventures
  getAdventures: (): Promise<AxiosResponse<Adventure[]>> =>
    apiClient.get('/adventures'),
  
  getAdventure: (id: string): Promise<AxiosResponse<any>> =>
    apiClient.get(`/adventures/${id}`),

  createAdventure: (data: { name: string; description: string; image: string; questions: any[] }): Promise<AxiosResponse<any>> => {
    return apiClient.post('/adventures', data, {
      headers: {
        'Content-Type': 'application/json'
      },
      validateStatus: (status) => status >= 200 && status < 500, // Don't reject responses with status 400
    });
  },

  updateAdventure: (id: string, data: any): Promise<AxiosResponse<any>> =>
    apiClient.put(`/adventures/${id}`, data),

  deleteAdventure: (id: string): Promise<AxiosResponse<any>> =>
    apiClient.delete(`/adventures/${id}`),

  // Quiz generation
  generateQuiz: (data: any): Promise<AxiosResponse<any>> =>
    apiClient.post('/generate-quiz', data),

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
