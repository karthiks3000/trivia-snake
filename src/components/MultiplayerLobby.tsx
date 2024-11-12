import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card, CardHeader, CardContent, CardFooter } from './ui/Card';
import { useWebSocket } from '../hooks/useWebSocket';
import { UserProfile } from '../App';
import { Player, WebSocketResponse } from '../interface';
import { Adventure } from './AdventureSelection';
import MultiplayerGame from './MultiplayerGame';

interface MultiplayerLobbyProps {
  userProfile: UserProfile;
}

const MultiplayerLobby: React.FC<MultiplayerLobbyProps> = ({ userProfile }) => {
  const { adventureId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const adventure = location.state?.adventure as Adventure;
  
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [isHost, setIsHost] = useState(false);
  const { isConnected, lastMessage, sendMessage, disconnect } = useWebSocket();
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [gameStarted, setGameStarted] = useState(false);
  const [gameState, setGameState] = useState<{
    questionIndex: number;
    timeLimit: number;
  } | null>(null);


  useEffect(() => {
    if (lastMessage) {
      try {
        const data = JSON.parse(lastMessage) as WebSocketResponse;
        handleWebSocketMessage(data);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    }
  }, [lastMessage, navigate, adventure]);

  const handleWebSocketMessage = (data: WebSocketResponse) => {
    switch (data.action) {
      case 'playerJoined':
      case 'playerLeft':
      case 'playerReady':
        if (data.players) {
          setPlayers(data.players);
        }
        break;
      case 'gameStarted':
        setGameStarted(true);
            setGameState({
              questionIndex: data.questionIndex!,
              timeLimit: data.timeLimit!
            });
        break;
    }
  };

  const createSession = async () => {
    if (!isConnected || isCreating) {
      return;
    }

    setIsCreating(true);
    try {
      const response = await sendMessage({
        action: 'createSession',
        adventureId: adventure.id,
        userId: userProfile.userId,
        username: userProfile.username,
        questions: adventure.questions
      });

      if (response && response.sessionId) {
        setSessionId(response.sessionId);
        setIsHost(true);
        setPlayers([{
          userId: userProfile.userId,
          username: userProfile.username,
          ready: true,
          score: 0,
          answered: false,
          connectionId: ''
        }]);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Failed to create session:', error);
      setSessionId(null);
      setIsHost(false);
      setPlayers([]);
    } finally {
      setIsCreating(false);
    }
  };

  
  const joinSession = async () => {
    if (!joinCode || isJoining) return;

    setIsJoining(true);
    try {
      const response = await sendMessage({
        action: 'joinSession',
        sessionId: joinCode,
        userId: userProfile.userId,
        username: userProfile.username
      });

      console.log('Join session response:', response);

      if (response.sessionId) {
        setSessionId(response.sessionId);
        // If the response includes existing players, set them
        if (response.players) {
          setPlayers(response.players);
        }
      }
    } catch (error) {
      console.error('Failed to join session:', error);
      setError('Failed to join session. Please check the code and try again.');
    } finally {
      setIsJoining(false);
    }
  };

    // Handle leaving the lobby
    const handleLeaveLobby = useCallback(() => {
      try {
        if (sessionId) {
          // Send leave message to server if needed
          sendMessage({
            action: 'leaveSession',
            sessionId,
            userId: userProfile.userId
          }).finally(() => {
            // Disconnect WebSocket
            disconnect();
            // Reset states
            setSessionId(null);
            setPlayers([]);
          });
        }
      } catch (error) {
        console.error('Error leaving lobby:', error);
      } finally{
        // Navigate or handle UI change
        navigate('/game/adventure-selection');
      }
    }, [sessionId, userProfile.userId, disconnect, navigate]);
  
    // Add cleanup on unmount
    useEffect(() => {
      return () => {
        disconnect();
      };
    }, [disconnect]);

  // Add a loading state
  if (!isConnected) {
    return <div>Connecting to game server...</div>;
  }

  const startGame = () => {
    if (!isHost) return;
    sendMessage({
      action: 'startGame',
      sessionId
    });
  };

  if (gameStarted && gameState && sessionId) {
    return (
      <MultiplayerGame
        userProfile={userProfile}
        adventure={adventure}
        sessionId={sessionId}
        initialQuestionIndex={gameState.questionIndex}
        timeLimit={gameState.timeLimit}
      />
    );
  }

  return (
    <div className="container mx-auto p-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <h2 className="text-2xl font-bold text-center">
            Multiplayer Lobby: {adventure.name}
          </h2>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="text-red-500 text-center mb-4">
              {error}
            </div>
          )}
          {!sessionId ? (
              <div className="space-y-4">
              <Button onClick={createSession} disabled={!isConnected || isCreating} className="w-full">
                {isCreating ? 'Creating Session...' : 'Create New Game Session'}
              </Button>
              <div className="flex space-x-2">
                <Input
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  placeholder="Enter session code" disabled={isJoining}
                />
                <Button onClick={joinSession}  disabled={!joinCode || isJoining}>
                  {isJoining ? 'Joining...' : 'Join Session'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-gray-100 p-4 rounded text-center">
                Session Code: {sessionId}
              </div>
              <h3 className="text-xl">Players ({players.length}/4)</h3>
              <div className="space-y-2">
                {players.map(player => (
                  <div key={player.userId} className="flex items-center justify-between p-3 bg-gray-100 rounded">
                    <span>{player.username}</span>
                    <span className={player.ready ? "text-green-500" : "text-gray-500"}>
                      {player.ready ? "Ready" : "Not Ready"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={handleLeaveLobby}>
            Leave Lobby
          </Button>
          {(sessionId && isHost)
             ? 
              <Button
                disabled={!players.every(p => p.ready)}
                onClick={startGame}
              >
                Start Game
              </Button>
            :<></>
          }
        </CardFooter>
      </Card>
    </div>
  );
};

export default MultiplayerLobby;
