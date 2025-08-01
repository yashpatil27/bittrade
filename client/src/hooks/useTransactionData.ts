import useTransactionUpdates from './useTransactionUpdates';
import useAllTransactions from './useAllTransactions';

interface UseTransactionDataReturn {
  transactions: any[];
  isLoading: boolean;
  error: string | null;
  fetchTransactions: () => void;
}

const useTransactionData = (isAdminView: boolean = false): UseTransactionDataReturn => {
  const userTransactions = useTransactionUpdates();
  const adminTransactions = useAllTransactions();
  
  if (isAdminView) {
    return {
      ...adminTransactions,
      fetchTransactions: adminTransactions.fetchAllTransactions
    };
  }
  
  return userTransactions;
};

export default useTransactionData;
