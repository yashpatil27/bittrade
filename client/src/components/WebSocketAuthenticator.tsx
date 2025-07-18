import React, { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../context/WebSocketContext';

interface BalanceData {
  available_inr: number;
  available_btc: number;
  reserved_inr: number;
  reserved_btc: number;
  collateral_btc: number;
  borrowed_inr: number;
  interest_accrued: number;
}

interface WebSocketAuthenticatorProps {
  onBalanceUpdate?: (data: BalanceData) => void;
}

/**
 * WebSocketAuthenticator component handles WebSocket authentication once per user session.
 * This prevents multiple components from authenticating separately and reduces cache updates.
 */
const WebSocketAuthenticator: React.FC<WebSocketAuthenticatorProps> = ({ onBalanceUpdate }) => {
  const { isAuthenticated, token } = useAuth();
  const { socket, isConnected } = useWebSocket();
  const hasAuthenticatedRef = useRef(false);
  const isAuthenticatingRef = useRef(false);

  useEffect(() => {
    if (socket && isConnected && isAuthenticated && token) {
      // Only authenticate once per socket connection
      if (!hasAuthenticatedRef.current && !isAuthenticatingRef.current) {
        isAuthenticatingRef.current = true;
        
        console.log('🔐 Authenticating WebSocket connection...');
        
        // Set up authentication event handlers
        const handleAuthSuccess = (data: any) => {
          console.log('🔐 WebSocket authenticated successfully:', data);
          hasAuthenticatedRef.current = true;
          isAuthenticatingRef.current = false;
        };
        
        const handleAuthError = (error: any) => {
          console.error('🔐 WebSocket authentication failed:', error);
          hasAuthenticatedRef.current = false;
          isAuthenticatingRef.current = false;
        };
        
        const handleBalanceUpdate = (data: BalanceData) => {
          console.log('📊 Received balance update:', data);
          if (onBalanceUpdate) {
            onBalanceUpdate(data);
          }
        };
        
        // Listen for authentication responses
        socket.on('authentication_success', handleAuthSuccess);
        socket.on('authentication_error', handleAuthError);
        socket.on('user_balance_update', handleBalanceUpdate);
        
        // Authenticate the WebSocket connection
        socket.emit('authenticate', token);
        
        // Cleanup function
        return () => {
          socket.off('authentication_success', handleAuthSuccess);
          socket.off('authentication_error', handleAuthError);
          socket.off('user_balance_update', handleBalanceUpdate);
        };
      }
    }
  }, [socket, isConnected, isAuthenticated, token, onBalanceUpdate]);

  // Reset authentication state when socket disconnects or user logs out
  useEffect(() => {
    if (!isConnected || !isAuthenticated) {
      hasAuthenticatedRef.current = false;
      isAuthenticatingRef.current = false;
    }
  }, [isConnected, isAuthenticated]);

  // This component doesn't render anything
  return null;
};

export default WebSocketAuthenticator;
