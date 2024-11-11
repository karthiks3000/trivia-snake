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
  ListGameSessions, 
  type ListGameSessionsQuery,
} from '../graphql/operations/queries';
import { Adventure, GameSession } from '../interface';
import { useNavigate } from 'react-router-dom';


// Mutation strings
export const createGameSessionMutation = /* GraphQL */ `
  mutation CreateGameSession($input: CreateGameSessionInput!) {
    createGameSession(input: $input) {
      id
      hostId
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

const joinGameSessionMutation = /* GraphQL */ `
  mutation JoinGameSession($input: JoinGameSessionInput!) {
    joinGameSession(input: $input) {
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

interface MultiplayerLobbyProps {
  adventure: Adventure;
}


const MultiplayerLobby: React.FC<MultiplayerLobbyProps> = ({adventure}) => {
  const { userProfile, setIsMultiplayer, sessionId, setSessionId, setPlayer2Profile } = useGameContext();
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [gameSessions, setGameSessions] = useState<GameSession[]>([]);
  const [nextToken, setNextToken] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isWaiting, setIsWaiting] = useState(false);
  const [canStartGame, setCanStartGame] = useState(false);
  const [bothPlayersJoined, setBothPlayersJoined] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const client = generateClient();
  const navigate = useNavigate();

  const handleChangeAdventure = () => {
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

  const fetchGameSessions = useCallback(async (token?: string | null) => {
    if (isLoading) return; // Prevent concurrent fetches
    
    setIsLoading(true);
    try {
      const { data } = await client.graphql<GraphQLQuery<ListGameSessionsQuery>>({
        query: ListGameSessions,
        variables: {
          limit: 10,
          nextToken: token || null
        }
      });

      if (data?.listGameSessions) {
        if (token) {
          setGameSessions(prev => [...prev, ...data.listGameSessions.items]);
        } else {
          setGameSessions(data.listGameSessions.items);
        }
        setNextToken(data.listGameSessions.nextToken || null);
        setHasMore(!!data.listGameSessions.nextToken);
      }
    } catch (error) {
      console.error('Error fetching game sessions:', error);
      setError('Failed to fetch game sessions');
    } finally {
      setIsLoading(false);
    }
  }, [client, isLoading]);

  // Initial fetch only
  useEffect(() => {
    fetchGameSessions(null);
  }, []); // Empty dependency array for initial fetch only

  // Polling with cleanup
  useEffect(() => {
    let mounted = true;
    let intervalId: NodeJS.Timeout;

    const pollGameSessions = async () => {
      if (!mounted) return;
      
      try {
        const { data } = await client.graphql<GraphQLQuery<ListGameSessionsQuery>>({
          query: ListGameSessions,
          variables: {
            limit: 10,
            nextToken: null // Always fetch first page in polls
          }
        });

        if (mounted && data?.listGameSessions) {
          setGameSessions(data.listGameSessions.items);
          setNextToken(data.listGameSessions.nextToken || null);
          setHasMore(!!data.listGameSessions.nextToken);
          
          if (sessionId) {
            const currentSession = data.listGameSessions.items.find(session => session.id === sessionId);
            if (currentSession) {
              // Host: Check if a guest has joined
              if (userProfile.userId === currentSession.guestId) {
                setIsWaiting(false);
                setBothPlayersJoined(true);
                setCanStartGame(true);
                setError('A player has joined your session! You can now start the game.');
              }
              
              // Guest: Check if they've successfully joined
              if (currentSession.guestId === userProfile.userId) {
                setIsWaiting(false);
                setError('You have joined the session. Waiting for the host to start the game.');
              }
              
              // Both: Check if the game is starting or in progress
              if (currentSession.sessionStatus === 'STARTING') {
                if (countdown === null) {
                  setCountdown(5);
                } else if (countdown > 0) {
                  setCountdown(prevCountdown => prevCountdown !== null ? prevCountdown - 1 : null);
                } else if (countdown === 0) {
                  // Update session status to IN_PROGRESS
                  await client.graphql<GraphQLQuery<StartGameSessionMutation>>({
                    query: startGameSessionMutation,
                    variables: {
                      sessionId: sessionId,
                      status: 'IN_PROGRESS'
                    }
                  });
                  setIsMultiplayer(true);
                  // The game will start in the next poll
                }
              }
              
              if (currentSession.sessionStatus === 'IN_PROGRESS') {
                setIsMultiplayer(true);
                // Redirect to the game component or start the game logic here
                // For example:
                // history.push(`/game/${sessionId}`);
                // or
                // setGameStarted(true);
                
                // Stop polling when the game is in progress
                if (intervalId) {
                  clearInterval(intervalId);
                }
              }

              // Update countdown message
              if (countdown !== null) {
                setError(`Game starting in ${countdown} seconds...`);
              }
            }
          }
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    };

    // Initial poll
    pollGameSessions();

    // Start polling
    intervalId = setInterval(pollGameSessions, 2000);

    // Cleanup function
    return () => {
      mounted = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [client, sessionId, setIsMultiplayer, userProfile.userId, countdown, setCountdown]);

  // Load more function
  const loadMore = useCallback(() => {
    if (nextToken && hasMore && !isLoading) {
      fetchGameSessions(nextToken);
    }
  }, [nextToken, hasMore, isLoading, fetchGameSessions]);


  const handleCreateSession = async () => {
    if (!adventure) {
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
            adventureId: adventure.id
          }
        }
      });
      const newSessionId = data.createGameSession.id;
      setSessionId(newSessionId);
      setIsMultiplayer(true);
      setIsWaiting(true);
      // Redirect to the waiting area
      navigate(`/waiting/${newSessionId}`);
    } catch (error) {
      console.error('Error creating game session:', error);
      setError('Failed to create game session. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartGame = async (sessionIdToStart: string) => {
    setIsLoading(true);
    setError(null);
    try {
      // Update the session status to STARTING
      await client.graphql<GraphQLQuery<StartGameSessionMutation>>({
        query: startGameSessionMutation,
        variables: {
          sessionId: sessionIdToStart,
          status: 'STARTING'
        }
      });
      
      // Start the countdown
      setCountdown(5);
      
      // The game start will be handled by the polling function
      // to ensure synchronization between both players
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
        username: 'Opponent',
      });
      setIsWaiting(false); // Guest is no longer waiting
      setCanStartGame(false); // Guest can't start the game, only the host can
      setError('You have joined the session. Waiting for the host to start the game.');
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
      {countdown !== null && (
        <div className="text-2xl font-bold text-center mb-4">
          Game starting in {countdown}...
        </div>
      )}
      
      <div className="mb-4">
        {!sessionId ? (
          <button 
            onClick={handleCreateSession} 
            className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
            disabled={isLoading}
          >
            Create New Session
          </button>
        ) : (
          <div>

          </div>
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
        {gameSessions.map((session) => {
          const canStart = session.hostId === userProfile.userId && session.guestId && session.sessionStatus === 'WAITING';
          return (
            <li key={session.id} className={`mb-2 ${canStart ? 'border-green-500 border-2 p-2 rounded' : ''}`}>
              <div>Session ID: {session.id}</div>
              <div>Host: {session.hostId}</div>
              <div>Adventure: {session.adventureId}</div>
              <div>Status: {session.sessionStatus}</div>
              <div>Current Question: {session.currentQuestionIndex + 1}</div>
              <div>Scores: Host {session.hostScore} - Guest {session.guestScore}</div>
              {canStart && (
                <button 
                  onClick={() => handleStartGame(session.id)}
                  className="mt-2 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                  disabled={isLoading}
                >
                  Start Game
                </button>
              )}
              {session.hostId === userProfile.userId && !session.guestId && (
                <div className="mt-2 text-yellow-500">Waiting for a guest to join...</div>
              )}
            </li>
          );
        })}
      </ul>

      {hasMore && !isLoading && (
        <button 
          onClick={loadMore}
          className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
          disabled={isLoading}
        >
        Load More
        </button>
      )}
       {error && (
        <div className="text-red-500 mt-4">
          {error}
        </div>
      )}
    </div>
  );
};

export default MultiplayerLobby;
