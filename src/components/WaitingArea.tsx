import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { generateClient } from 'aws-amplify/api';
import { GraphQLQuery } from '@aws-amplify/api';
import { useGameContext } from './GameContext';
import { GetGameSessionQuery } from '../graphql/operations/queries';
import { StartGameSessionMutation } from '../graphql/operations/mutations';
import { GameSession } from '../interface';

const getGameSessionQuery = /* GraphQL */ `
  query GetGameSession($id: ID!) {
    getGameSession(id: $id) {
      id
      hostId
      guestId
      adventureId
      sessionStatus
      currentQuestionIndex
      hostScore
      guestScore
      createdAt
      updatedAt
    }
  }
`;

const startGameSessionMutation = /* GraphQL */ `
  mutation StartGameSession($sessionId: ID!, $status: String!) {
    startGameSession(sessionId: $sessionId, status: $status) {
      id
      sessionStatus
      currentQuestionIndex
      updatedAt
    }
  }
`;

const WaitingArea: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { userProfile } = useGameContext();
  const [session, setSession] = useState<GameSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const client = generateClient();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const { data } = await client.graphql<GraphQLQuery<GetGameSessionQuery>>({
          query: getGameSessionQuery,
          variables: { id: sessionId }
        });
        setSession(data.getGameSession);
      } catch (error) {
        console.error('Error fetching game session:', error);
        setError('Failed to fetch game session. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSession();
    const interval = setInterval(fetchSession, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [sessionId, client]);

  const handleStartGame = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await client.graphql<GraphQLQuery<StartGameSessionMutation>>({
        query: startGameSessionMutation,
        variables: {
          sessionId: sessionId,
          status: 'IN_PROGRESS'
        }
      });
      navigate(`/game/${sessionId}`);
    } catch (error) {
      console.error('Error starting game session:', error);
      setError('Failed to start game. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  if (!session) {
    return <div>Session not found</div>;
  }

  const isHost = session.hostId === userProfile.userId;
  const hasGuest = session.guestId !== null;
  const canStartGame = isHost && hasGuest;

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Waiting Area</h2>
      <p>Session ID: {session.id}</p>
      <p>Host: {session.hostId}</p>
      <p>Guest: {session.guestId || 'Waiting for guest to join...'}</p>
      <p>Status: {session.sessionStatus}</p>
      {isHost && (
        hasGuest ? (
          <button
            onClick={handleStartGame}
            className="mt-4 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            disabled={isLoading}
          >
            Start Game
          </button>
        ) : (
          <p>Waiting for a guest to join before you can start the game...</p>
        )
      )}
      {!isHost && (
        hasGuest ? (
          <p>Waiting for the host to start the game...</p>
        ) : (
          <p>Waiting for another player to join...</p>
        )
      )}
    </div>
  );
};

export default WaitingArea;