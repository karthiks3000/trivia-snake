// src/contexts/WebSocketContext.tsx
import { getCurrentUser } from 'aws-amplify/auth';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserProfile } from './App';
import { Player, WebSocketMessage, WebSocketResponse } from './interface';

interface WebSocketContextType {
  socket: WebSocket | null;
  isConnected: boolean;
  sendMessage: (messageWithId: any) => Promise<any>;
  lastMessage: WebSocketResponse | null;
}


const WebSocketContext = createContext<WebSocketContextType | null>(null);

interface WebSocketProviderProps {
    children: React.ReactNode;
    userProfile: UserProfile;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children, userProfile }) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketResponse | null>(null);

  useEffect(() => {
    const wsUrl = `${process.env.REACT_APP_WEBSOCKET_URL}?userId=${userProfile.userId}&username=${userProfile.username}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setIsConnected(true);
      console.log('Connected to WebSocket');
    };

    ws.onclose = () => {
      setIsConnected(false);
      console.log('Disconnected from WebSocket');
    };

    ws.onmessage = (event) => {
        const message = JSON.parse(event.data) as WebSocketResponse;
        setLastMessage(message);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    setSocket(ws);

    return () => {
      ws.close();
    };
  }, []);


  const sendMessage = useCallback((message: WebSocketMessage): Promise<any> => {
    return new Promise((resolve, reject) => {
      if (!socket || socket.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      const messageId = Date.now().toString();
      const messageWithId = { ...message, messageId };

      const handleResponse = (event: MessageEvent) => {
        try {
          const response = JSON.parse(event.data);
          if (response.sessionId) {
            socket.removeEventListener('message', handleResponse);
            clearTimeout(timeoutId);
            resolve(response);
            return;
          }
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      };

      socket.addEventListener('message', handleResponse);
      socket.send(JSON.stringify(messageWithId));

      // Timeout after 5 seconds
      const timeoutId = setTimeout(() => {
        socket.removeEventListener('message', handleResponse);
        // Don't reject if we already got a successful response
        if (lastMessage) {
          try {
            if (lastMessage.sessionId) {
              resolve(lastMessage);
              return;
            }
          } catch (error) {
            console.error('Error parsing last message:', error);
          }
        }
        // reject(new Error('WebSocket message timeout'));
      }, 5000);

      // Clear timeout if message is received
      return () => clearTimeout(timeoutId);
    });
  }, [socket, isConnected]);

  const value = {
    socket,
    isConnected,
    sendMessage,
    lastMessage
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

// Custom hook to use the WebSocket context
export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};
