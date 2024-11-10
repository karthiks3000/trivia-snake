import React, { useState, useEffect, useCallback } from 'react';
import { generateClient } from 'aws-amplify/api';
import { GraphQLQuery } from '@aws-amplify/api';
import { useGameContext } from './GameContext';
import { 
  CreateGameSessionMutation,
  JoinGameSessionMutation,
  StartGameSessionMutation
} from '../graphql/operations/mutations';
import { 
  listGameSessions, 
  listAdventures,
  type ListGameSessionsQuery,
  type ListAdventuresQuery,
  type Adventure,
  type GameSession 
} from '../graphql/operations/queries';

// Mutation strings
export const createGameSessionMutation = /* GraphQL */ `
  mutation CreateGameSession($input: CreateGameSessionInput!) {
    createGameSession(input: $input) {
      id
      hostId
      adventureId
      status
      currentQuestionIndex
      hostScore
      guestScore
      createdAt
      updatedAt
    }
  }
`;

const joinGameSessionMutation = /* GraphQL */ `
  mutation JoinGameSession($input: JoinGameSessionInput!) {
    joinGameSession(input: $input) {
      id
      hostId
      guestId
      adventureId
      status
      currentQuestionIndex
      hostScore
      guestScore
      createdAt
      updatedAt
    }
  }
`;

const startGameSessionMutation = /* GraphQL */ `
  mutation StartGameSession($sessionId: ID!) {
    startGameSession(sessionId: $sessionId) {
      id
      status
      currentQuestionIndex
      updatedAt
    }
  }
`;

interface UserProfile {
  userId: string;
  username: string;
}

const MultiplayerLobby: React.FC = () => {
  const { userProfile, setIsMultiplayer, sessionId, setSessionId, setPlayer2Profile } = useGameContext();
  const [inviteCode, setInviteCode] = useState('');
  const [selectedAdventureId, setSelectedAdventureId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [adventures, setAdventures] = useState<Adventure[]>([]);
  const [gameSessions, setGameSessions] = useState<GameSession[]>([]);

  const client = generateClient();

  const fetchGameSessions = useCallback(async () => {
    try {
      const { data } = await listGameSessions();
      if (data?.listGameSessions?.items) {
        setGameSessions(data.listGameSessions.items);
      }
    } catch (error) {
      console.error('Error fetching game sessions:', error);
    }
  }, []);

  const fetchAdventures = useCallback(async () => {
    try {
      const { data } = await listAdventures();
      if (data?.listAdventures?.items) {
        setAdventures(data.listAdventures.items);
      }
    } catch (error) {
      console.error('Error fetching adventures:', error);
    }
  }, []);

  useEffect(() => {
    fetchAdventures();
  }, [fetchAdventures]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchGameSessions();
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchGameSessions]);

  const handleCreateSession = async () => {
    if (!selectedAdventureId) {
      setError('Please select an adventure first');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await client.graphql<GraphQLQuery<CreateGameSessionMutation>>({
        query: createGameSessionMutation,
        variables: {
          input: {
            hostId: userProfile.userId,
            adventureId: selectedAdventureId
          }
        }
      });
      setSessionId(data.createGameSession.id);
      setIsMultiplayer(true);
    } catch (error) {
      console.error('Error creating game session:', error);
      setError('Failed to create game session. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartGame = async () => {
    if (!sessionId) {
      setError('No active session to start');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await client.graphql<GraphQLQuery<StartGameSessionMutation>>({
        query: startGameSessionMutation,
        variables: {
          sessionId: sessionId
        }
      });
      // Game will start automatically due to subscription in Game component
    } catch (error) {
      console.error('Error starting game session:', error);
      setError('Failed to start game. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinSession = async () => {
    if (!inviteCode) {
      setError('Please enter an invite code');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await client.graphql<GraphQLQuery<JoinGameSessionMutation>>({
        query: joinGameSessionMutation,
        variables: {
          input: {
            sessionId: inviteCode,
            guestId: userProfile.userId
          }
        }
      });
      setSessionId(data.joinGameSession.id);
      setIsMultiplayer(true);
      setPlayer2Profile({
        userId: data.joinGameSession.hostId,
        username: 'Opponent'
      });
    } catch (error) {
      console.error('Error joining game session:', error);
      setError('Failed to join game session. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Multiplayer Lobby</h2>
      {error && <div className="text-red-500 mb-4">{error}</div>}
      {isLoading && <div className="text-blue-500 mb-4">Loading...</div>}
      
      <div className="mb-4">
        <select
          value={selectedAdventureId}
          onChange={(e) => setSelectedAdventureId(e.target.value)}
          className="mr-2 p-2 border rounded"
          disabled={isLoading}
        >
          <option value="">Select an adventure</option>
          {adventures.map((adventure) => (
            <option key={adventure.id} value={adventure.id}>
              {adventure.title} - {adventure.description}
            </option>
          ))}
        </select>
        
        <button 
          onClick={handleCreateSession} 
          className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
          disabled={isLoading}
        >
          Create New Session
        </button>
        
        {sessionId && (
          <button 
            onClick={handleStartGame} 
            className="bg-green-500 text-white px-4 py-2 rounded"
            disabled={isLoading}
          >
            Start Game
          </button>
        )}
      </div>

      <div className="mb-4">
        <input
          type="text"
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value)}
          placeholder="Enter invite code"
          className="mr-2 p-2 border rounded"
          disabled={isLoading}
        />
        <button 
          onClick={handleJoinSession} 
          className="bg-green-500 text-white px-4 py-2 rounded"
          disabled={isLoading}
        >
          Join Session
        </button>
      </div>

      <h3 className="text-xl font-bold mb-2">Available Sessions:</h3>
      <ul className="list-disc pl-5">
        {gameSessions.map((session) => (
          <li key={session.id} className="mb-2">
            <div>Session ID: {session.id}</div>
            <div>Host: {session.hostId}</div>
            <div>Adventure: {
              adventures.find(adv => adv.id === session.adventureId)?.title || session.adventureId
            }</div>
            <div>Status: {session.status}</div>
            <div>Current Question: {session.currentQuestionIndex + 1}</div>
            <div>Scores: Host {session.hostScore} - Guest {session.guestScore}</div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default MultiplayerLobby;
