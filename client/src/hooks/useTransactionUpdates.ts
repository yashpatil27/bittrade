import { useState, useEffect, useCallback } from 'react';
import { useWebSocketEvent } from '../context/WebSocketContext';
import { Transaction } from '../types';

interface TransactionUpdateData {
  transactions: Transaction[];
  timestamp: string;
}

interface UseTransactionUpdatesReturn {
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  fetchTransactions: (page?: number, limit?: number) => Promise<void>;
  hasMore: boolean;
  page: number;
}

export const useTransactionUpdates = (): UseTransactionUpdatesReturn => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  // Listen for WebSocket transaction updates
  useWebSocketEvent<TransactionUpdateData>('user_transaction_update', (data) => {
    console.log('📡 Received transaction update:', data);
    
    if (data && data.transactions) {
      // Update with the most recent 15 transactions from WebSocket
      setTransactions(data.transactions);
      setError(null);
    }
  });

  // Fetch transactions from REST API (fallback and pagination)
  const fetchTransactions = useCallback(async (requestedPage: number = 1, limit: number = 50) => {
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/transactions?page=${requestedPage}&limit=${limit}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (requestedPage === 1) {
        // Replace transactions for first page
        setTransactions(data.transactions || []);
      } else {
        // Append transactions for subsequent pages
        setTransactions(prev => [...prev, ...(data.transactions || [])]);
      }
      
      setHasMore(data.hasMore || false);
      setPage(requestedPage);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    fetchTransactions(1);
  }, [fetchTransactions]);

  return {
    transactions,
    isLoading,
    error,
    fetchTransactions,
    hasMore,
    page,
  };
};

export default useTransactionUpdates;
