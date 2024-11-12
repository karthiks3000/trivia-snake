// hooks/useWebSocket.ts
import { useState, useRef, useCallback, useEffect } from 'react';
import { fetchAuthSession, getCurrentUser } from 'aws-amplify/auth';
import { WebSocketMessage } from '../interface';


export const useWebSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const maxRetries = 3;
  // Add a ref to track if we should reconnect
  const shouldReconnect = useRef(true);

  const disconnect = useCallback(() => {
    // Set shouldReconnect to false to prevent reconnection attempts
    shouldReconnect.current = false;
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
    setConnectionAttempts(0);
  }, []);

  useEffect(() => {
    const connectWebSocket = async () => {
      try {
        // Don't create a new connection if one exists or if we shouldn't reconnect
        if (wsRef.current || !shouldReconnect.current) {
          return;
        }

        const { tokens } = await fetchAuthSession();
        const user = await getCurrentUser();
        const idToken = 'Bearer ' + tokens?.idToken?.toString();

        const wsUrl = `${process.env.REACT_APP_WEBSOCKET_URL}?userId=${user.userId}&username=${user.username}`;
        const socket = new WebSocket(wsUrl);

        socket.onopen = () => {
          console.log('WebSocket Connected');
          setIsConnected(true);
          setConnectionAttempts(0);
        };

        socket.onclose = (event) => {
          console.log('WebSocket Disconnected:', event.code, event.reason);
          setIsConnected(false);
          wsRef.current = null;

          // Only attempt to reconnect if shouldReconnect is true
          if (shouldReconnect.current && connectionAttempts < maxRetries) {
            const timeout = setTimeout(() => {
              setConnectionAttempts(prev => prev + 1);
              connectWebSocket();
            }, 1000 * Math.pow(2, connectionAttempts));

            return () => clearTimeout(timeout);
          }
        };

        socket.onmessage = (event) => {
          try {
            console.log('Received message:', event.data);
            setLastMessage(event.data);
          } catch (error) {
            console.error('Error parsing message:', error);
          }
        };

        socket.onerror = (error) => {
          console.error('WebSocket Error:', error);
        };

        wsRef.current = socket;
      } catch (error) {
        console.error('Failed to connect to WebSocket:', error);
        if (error instanceof Error && error.message.includes('No current user')) {
          console.log('User not authenticated');
        } else if (shouldReconnect.current && connectionAttempts < maxRetries) {
          setTimeout(() => {
            setConnectionAttempts(prev => prev + 1);
            connectWebSocket();
          }, 1000 * Math.pow(2, connectionAttempts));
        }
      }
    };

    // Set shouldReconnect to true when the effect runs
    shouldReconnect.current = true;
    connectWebSocket();

    // Cleanup function
    return () => {
      disconnect();
    };
  }, [connectionAttempts, disconnect]);



  const sendMessage = useCallback((message: WebSocketMessage): Promise<any> => {
    return new Promise((resolve, reject) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      const messageId = Date.now().toString();
      const messageWithId = { ...message, messageId };

      const handleResponse = (event: MessageEvent) => {
        try {
          console.log('handleResponse:', event.data);
          const response = JSON.parse(event.data);
          if (response.sessionId) {
            wsRef.current?.removeEventListener('message', handleResponse);
            clearTimeout(timeoutId);
            resolve(response);
            return;
          }
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      };

      wsRef.current.addEventListener('message', handleResponse);
      wsRef.current.send(JSON.stringify(messageWithId));

      // Timeout after 5 seconds
      const timeoutId = setTimeout(() => {
        wsRef.current?.removeEventListener('message', handleResponse);
        // Don't reject if we already got a successful response
        if (lastMessage) {
          try {
            const response = JSON.parse(lastMessage);
            if (response.sessionId) {
              resolve(response);
              return;
            }
          } catch (error) {
            console.error('Error parsing last message:', error);
          }
        }
        reject(new Error('WebSocket message timeout'));
      }, 5000);

      // Clear timeout if message is received
      return () => clearTimeout(timeoutId);
    });
  }, []);

  return { isConnected, lastMessage, sendMessage, disconnect };
};
