import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { getWebSocketUrl } from '../utils/api';

interface WebSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'reconnecting';
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

interface WebSocketProviderProps {
  children: ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'reconnecting'>('disconnected');

  useEffect(() => {
    // Initialize Socket.IO connection
    const socketInstance = io(getWebSocketUrl(), {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      autoConnect: true,
    });

    // Connection event handlers
    socketInstance.on('connect', () => {
      console.log('🌐 Connected to WebSocket server');
      setIsConnected(true);
      setConnectionStatus('connected');
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('🌐 Disconnected from WebSocket server:', reason);
      setIsConnected(false);
      setConnectionStatus('disconnected');
    });

    socketInstance.on('reconnecting', (attemptNumber) => {
      console.log(`🌐 Reconnecting to WebSocket server (attempt ${attemptNumber})`);
      setConnectionStatus('reconnecting');
    });

    socketInstance.on('reconnect', (attemptNumber) => {
      console.log(`🌐 Reconnected to WebSocket server (attempt ${attemptNumber})`);
      setIsConnected(true);
      setConnectionStatus('connected');
    });

    socketInstance.on('connect_error', (error) => {
      console.error('🌐 WebSocket connection error:', error);
      setConnectionStatus('disconnected');
    });

    // Handle initial connection acknowledgment
    socketInstance.on('connection_established', (data) => {
      console.log('🌐 Connection established:', data);
    });

    // Set socket instance
    setSocket(socketInstance);
    setConnectionStatus('connecting');

    // Cleanup function
    return () => {
      console.log('🌐 Cleaning up WebSocket connection');
      socketInstance.disconnect();
    };
  }, []);

  const value: WebSocketContextType = {
    socket,
    isConnected,
    connectionStatus,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

// Custom hook to use WebSocket context
export const useWebSocket = (): WebSocketContextType => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

// Custom hook for listening to specific events
export const useWebSocketEvent = <T = any>(eventName: string, callback: (data: T) => void) => {
  const { socket } = useWebSocket();

  useEffect(() => {
    if (!socket) return;

    const eventHandler = (data: T) => {
      callback(data);
    };

    socket.on(eventName, eventHandler);

    return () => {
      socket.off(eventName, eventHandler);
    };
  }, [socket, eventName, callback]);
};

export default WebSocketContext;
