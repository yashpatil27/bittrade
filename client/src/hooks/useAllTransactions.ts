import { useState, useEffect } from 'react';
import { Transaction } from '../types';
import { getApiUrl } from '../utils/api';

interface UseAllTransactionsReturn {
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  fetchAllTransactions: () => void;
}

const useAllTransactions = (): UseAllTransactionsReturn => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllTransactions = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('bittrade_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${getApiUrl()}/api/admin/transactions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch transactions');
      }

      const data = await response.json();
      setTransactions(data.transactions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
      console.error('Error fetching all transactions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllTransactions();
  }, []);

  return {
    transactions,
    isLoading,
    error,
    fetchAllTransactions
  };
};

export default useAllTransactions;
