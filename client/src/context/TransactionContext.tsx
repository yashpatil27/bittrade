import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { useWebSocketEvent } from './WebSocketContext';
import { getApiUrl } from '../utils/api';
import { Transaction } from '../types';

interface TransactionUpdateData {
  transactions: Transaction[];
  timestamp: string;
}

interface TransactionContextType {
  // User transactions
  userTransactions: Transaction[];
  userTransactionsLoading: boolean;
  userTransactionsError: string | null;
  
  // Admin transactions (all users)
  adminTransactions: Transaction[];
  adminTransactionsLoading: boolean;
  adminTransactionsError: string | null;
  
  // Pagination
  hasMoreUserTransactions: boolean;
  userTransactionsPage: number;
  
  // Actions
  refetchUserTransactions: (page?: number, limit?: number) => Promise<void>;
  refetchAdminTransactions: () => Promise<void>;
  
  // Filtered data (computed)
  getPendingOrders: (isAdmin?: boolean) => Transaction[];
  getDCATransactions: (isAdmin?: boolean) => Transaction[];
  getCompletedTransactions: (isAdmin?: boolean) => Transaction[];
  getRecentTransactions: (limit: number, isAdmin?: boolean) => Transaction[];
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

interface TransactionProviderProps {
  children: ReactNode;
}

export const TransactionProvider: React.FC<TransactionProviderProps> = ({ children }) => {
  // User transactions state
  const [userTransactions, setUserTransactions] = useState<Transaction[]>([]);
  const [userTransactionsLoading, setUserTransactionsLoading] = useState(true);
  const [userTransactionsError, setUserTransactionsError] = useState<string | null>(null);
  const [hasMoreUserTransactions, setHasMoreUserTransactions] = useState(true);
  const [userTransactionsPage, setUserTransactionsPage] = useState(1);

  // Admin transactions state
  const [adminTransactions, setAdminTransactions] = useState<Transaction[]>([]);
  const [adminTransactionsLoading, setAdminTransactionsLoading] = useState(false);
  const [adminTransactionsError, setAdminTransactionsError] = useState<string | null>(null);

  const { isAuthenticated, token } = useAuth();

  // Fetch user transactions
  const fetchUserTransactions = useCallback(async (requestedPage: number = 1, limit: number = 50) => {
    if (!isAuthenticated || !token) {
      setUserTransactions([]);
      setUserTransactionsLoading(false);
      return;
    }

    setUserTransactionsLoading(true);
    setUserTransactionsError(null);

    try {
      const response = await fetch(
        `${getApiUrl()}/api/transactions?page=${requestedPage}&limit=${limit}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        if (response.status === 403) {
          localStorage.removeItem('bittrade_token');
          window.location.href = '/login';
          throw new Error('Session expired. Please login again.');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (requestedPage === 1) {
        setUserTransactions(data.transactions || []);
      } else {
        setUserTransactions(prev => [...prev, ...(data.transactions || [])]);
      }
      
      setHasMoreUserTransactions(data.hasMore || false);
      setUserTransactionsPage(requestedPage);
      console.log('📊 TransactionContext: Fetched user transactions:', data.transactions?.length || 0);
    } catch (err) {
      console.error('❌ TransactionContext: User transactions fetch error:', err);
      setUserTransactionsError(err instanceof Error ? err.message : 'Failed to fetch transactions');
    } finally {
      setUserTransactionsLoading(false);
    }
  }, [isAuthenticated, token]);

  // Fetch admin transactions
  const fetchAdminTransactions = useCallback(async () => {
    if (!isAuthenticated || !token) {
      setAdminTransactions([]);
      return;
    }

    setAdminTransactionsLoading(true);
    setAdminTransactionsError(null);

    try {
      const response = await fetch(`${getApiUrl()}/api/admin/transactions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch admin transactions');
      }

      const data = await response.json();
      setAdminTransactions(data.transactions || []);
      console.log('📊 TransactionContext: Fetched admin transactions:', data.transactions?.length || 0);
    } catch (err) {
      console.error('❌ TransactionContext: Admin transactions fetch error:', err);
      setAdminTransactionsError(err instanceof Error ? err.message : 'Failed to fetch admin transactions');
    } finally {
      setAdminTransactionsLoading(false);
    }
  }, [isAuthenticated, token]);

  // Initial fetch on mount or auth change
  useEffect(() => {
    if (isAuthenticated) {
      fetchUserTransactions(1);
    } else {
      setUserTransactions([]);
      setAdminTransactions([]);
      setUserTransactionsLoading(false);
      setAdminTransactionsLoading(false);
    }
  }, [isAuthenticated, fetchUserTransactions]);

  // Handle WebSocket transaction updates
  useWebSocketEvent<TransactionUpdateData>('user_transaction_update', (data) => {
    console.log('📊 TransactionContext: Received transaction update via WebSocket:', data);
    
    if (data && data.transactions) {
      // Update user transactions with the most recent data from WebSocket
      setUserTransactions(data.transactions);
      setUserTransactionsError(null);
      setUserTransactionsLoading(false);
    }
  });

  // Computed/filtered data using useMemo for performance
  const getPendingOrders = useCallback((isAdmin: boolean = false): Transaction[] => {
    const transactions = isAdmin ? adminTransactions : userTransactions;
    return transactions.filter(txn => 
      txn.status === 'PENDING' && (txn.type === 'LIMIT_BUY' || txn.type === 'LIMIT_SELL')
    );
  }, [userTransactions, adminTransactions]);

  const getDCATransactions = useCallback((isAdmin: boolean = false): Transaction[] => {
    const transactions = isAdmin ? adminTransactions : userTransactions;
    return transactions.filter(txn => txn.type === 'DCA_BUY' || txn.type === 'DCA_SELL');
  }, [userTransactions, adminTransactions]);

  const getCompletedTransactions = useCallback((isAdmin: boolean = false): Transaction[] => {
    const transactions = isAdmin ? adminTransactions : userTransactions;
    return transactions.filter(txn => 
      !(txn.status === 'PENDING' && (txn.type === 'LIMIT_BUY' || txn.type === 'LIMIT_SELL'))
    );
  }, [userTransactions, adminTransactions]);

  const getRecentTransactions = useCallback((limit: number, isAdmin: boolean = false): Transaction[] => {
    const transactions = getCompletedTransactions(isAdmin);
    return transactions.slice(0, limit);
  }, [getCompletedTransactions]);

  const value: TransactionContextType = {
    // User transactions
    userTransactions,
    userTransactionsLoading,
    userTransactionsError,
    
    // Admin transactions
    adminTransactions,
    adminTransactionsLoading,
    adminTransactionsError,
    
    // Pagination
    hasMoreUserTransactions,
    userTransactionsPage,
    
    // Actions
    refetchUserTransactions: fetchUserTransactions,
    refetchAdminTransactions: fetchAdminTransactions,
    
    // Filtered data
    getPendingOrders,
    getDCATransactions,
    getCompletedTransactions,
    getRecentTransactions,
  };

  return (
    <TransactionContext.Provider value={value}>
      {children}
    </TransactionContext.Provider>
  );
};

// Custom hook to use transaction context
export const useTransactions = (): TransactionContextType => {
  const context = useContext(TransactionContext);
  if (context === undefined) {
    throw new Error('useTransactions must be used within a TransactionProvider');
  }
  return context;
};

export default TransactionContext;
