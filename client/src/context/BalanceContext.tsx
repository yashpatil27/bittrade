import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useWebSocketEvent } from './WebSocketContext';
import { getApiUrl } from '../utils/api';

interface BalanceData {
  available_inr: number;
  available_btc: number;
  reserved_inr: number;
  reserved_btc: number;
  collateral_btc: number;
  borrowed_inr: number;
  interest_accrued: number;
}

interface AdminTotalBalanceData {
  total_available_inr: number;
  total_available_btc: number;
  total_reserved_inr: number;
  total_reserved_btc: number;
  total_collateral_btc: number;
  total_borrowed_inr: number;
  total_interest_accrued: number;
}

interface BalanceContextType {
  balanceData: BalanceData | null;
  adminBalanceData: AdminTotalBalanceData | null;
  isLoading: boolean;
  error: string | null;
  refetchBalance: () => Promise<void>;
  refetchAdminBalance: () => Promise<void>;
}

const BalanceContext = createContext<BalanceContextType | undefined>(undefined);

interface BalanceProviderProps {
  children: ReactNode;
}

export const BalanceProvider: React.FC<BalanceProviderProps> = ({ children }) => {
  const [balanceData, setBalanceData] = useState<BalanceData | null>(null);
  const [adminBalanceData, setAdminBalanceData] = useState<AdminTotalBalanceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { isAuthenticated, token } = useAuth();
  // Get WebSocket connection (for future use)
  // const { socket, isConnected } = useWebSocket();

  // Function to fetch user balance
  const fetchUserBalance = useCallback(async () => {
    if (!isAuthenticated || !token) {
      setBalanceData(null);
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      const response = await fetch(`${getApiUrl()}/api/balance`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setBalanceData(data);
        console.log('📊 BalanceContext: Fetched user balance:', data);
      } else {
        console.error('❌ BalanceContext: Balance fetch failed:', response.status, response.statusText);
        setError('Failed to fetch balance');
      }
    } catch (err) {
      console.error('❌ BalanceContext: Balance fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch balance');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, token]);

  // Function to fetch admin total balance
  const fetchAdminBalance = useCallback(async () => {
    if (!isAuthenticated || !token) {
      setAdminBalanceData(null);
      return;
    }

    try {
      setError(null);
      const response = await fetch(`${getApiUrl()}/api/admin/total-balance`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAdminBalanceData(data);
        console.log('📊 BalanceContext: Fetched admin balance:', data);
      } else {
        console.error('❌ BalanceContext: Admin balance fetch failed:', response.status, response.statusText);
        setError('Failed to fetch admin balance');
      }
    } catch (err) {
      console.error('❌ BalanceContext: Admin balance fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch admin balance');
    }
  }, [isAuthenticated, token]);

  // Initial balance fetch on mount or auth change
  useEffect(() => {
    if (isAuthenticated) {
      fetchUserBalance();
    } else {
      setBalanceData(null);
      setAdminBalanceData(null);
      setIsLoading(false);
    }
  }, [isAuthenticated, fetchUserBalance]);

  // Handle WebSocket balance updates
  useWebSocketEvent<BalanceData>('user_balance_update', (data) => {
    console.log('📊 BalanceContext: Received balance update via WebSocket:', data);
    setBalanceData(data);
    setIsLoading(false);
  });

  // Handle WebSocket balance updates for admin (when any user balance changes)
  useWebSocketEvent<BalanceData>('user_balance_update', (data) => {
    // For admin views, refresh total balance when any user balance changes
    if (adminBalanceData) {
      console.log('📊 BalanceContext: User balance changed, refreshing admin total balance');
      fetchAdminBalance();
    }
  });

  const value: BalanceContextType = {
    balanceData,
    adminBalanceData,
    isLoading,
    error,
    refetchBalance: fetchUserBalance,
    refetchAdminBalance: fetchAdminBalance,
  };

  return (
    <BalanceContext.Provider value={value}>
      {children}
    </BalanceContext.Provider>
  );
};

// Custom hook to use balance context
export const useBalance = (): BalanceContextType => {
  const context = useContext(BalanceContext);
  if (context === undefined) {
    throw new Error('useBalance must be used within a BalanceProvider');
  }
  return context;
};

export default BalanceContext;
