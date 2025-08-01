import React, { useState } from 'react';
import { ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown } from 'lucide-react';
import { formatRelativeTime } from '../utils/dateUtils';
import { formatRupeesForDisplay, formatBitcoinForDisplay } from '../utils/formatters';
import { Transaction } from '../types';
import useAllTransactions from '../hooks/useAllTransactions';
import DetailsModal from './DetailsModal';

interface AdminTransactionListProps {
  title?: string;
  showViewAll?: boolean;
  excludePending?: boolean;
  onTransactionClick?: (transaction: Transaction) => void;
}

const AdminTransactionList: React.FC<AdminTransactionListProps> = ({
  title = 'All Transactions',
  showViewAll = false,
  excludePending = true,
  onTransactionClick,
}) => {
  const { transactions, isLoading, error } = useAllTransactions();
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'MARKET_BUY':
      case 'LIMIT_BUY':
      case 'DCA_BUY':
        return <ArrowUpRight className="w-4 h-4" />;
      case 'MARKET_SELL':
      case 'LIMIT_SELL':
      case 'DCA_SELL':
        return <ArrowDownRight className="w-4 h-4" />;
      case 'DEPOSIT_INR':
      case 'DEPOSIT_BTC':
      case 'LOAN_CREATE':
      case 'LOAN_ADD_COLLATERAL':
        return <TrendingUp className="w-4 h-4" />;
      case 'WITHDRAW_INR':
      case 'WITHDRAW_BTC':
      case 'LOAN_REPAY':
      case 'LIQUIDATION':
      case 'PARTIAL_LIQUIDATION':
      case 'FULL_LIQUIDATION':
        return <TrendingDown className="w-4 h-4" />;
      case 'LOAN_BORROW':
      case 'INTEREST_ACCRUAL':
        return <ArrowUpRight className="w-4 h-4" />;
      default: return <div className="w-4 h-4" />;
    }
  };

  const getTransactionLabel = (type: string, status?: string) => {
    switch (type) {
      case 'MARKET_BUY':
        return 'Bitcoin Purchase';
      case 'MARKET_SELL':
        return 'Bitcoin Sale';
      case 'LIMIT_BUY':
        return status === 'PENDING' ? 'Bitcoin Limit Purchase (Pending)' : 'Bitcoin Limit Purchase';
      case 'LIMIT_SELL':
        return status === 'PENDING' ? 'Bitcoin Limit Sale (Pending)' : 'Bitcoin Limit Sale';
      case 'DCA_BUY':
        return 'DCA Bitcoin Purchase';
      case 'DCA_SELL':
        return 'DCA Bitcoin Sale';
      default:
        return type || 'Unknown Transaction';
    }
  };

  const getTransactionAmount = (txn: Transaction) => {
    switch (txn.type) {
      case 'LOAN_BORROW':
      case 'LOAN_REPAY':
      case 'INTEREST_ACCRUAL':
      case 'DEPOSIT_INR':
      case 'WITHDRAW_INR':
        return formatRupeesForDisplay(txn.inr_amount || 0);
      default:
        return formatBitcoinForDisplay(txn.btc_amount || 0);
    }
  };

  const getTransactionSubAmount = (txn: Transaction) => {
    switch (txn.type) {
      case 'MARKET_BUY':
      case 'MARKET_SELL':
      case 'LIMIT_BUY':
      case 'LIMIT_SELL':
      case 'DCA_BUY':
      case 'DCA_SELL':
        return formatRupeesForDisplay(txn.inr_amount || 0);
      default:
        return null;
    }
  };

  const handleTransactionClick = (transaction: Transaction) => {
    if (onTransactionClick) {
      setSelectedTransaction(transaction);
      setIsDetailsModalOpen(true);
    }
  };

  const getTransactionDetails = (txn: Transaction) => {
    return [
      { label: 'Transaction ID', value: txn.id, highlight: false },
      { label: 'Status', value: txn.status, highlight: true },
      { label: 'Execution Price', value: formatRupeesForDisplay(txn.execution_price || 0), highlight: false },
      { label: 'Created At', value: new Date(txn.created_at || '').toLocaleString(), highlight: false },
    ];
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400 text-sm">Loading transactions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 text-sm">Error: {error}</p>
      </div>
    );
  }

  // Filter transactions if excludePending is true
  const filteredTransactions = excludePending 
    ? transactions.filter(txn => 
        !(txn.status === 'PENDING' && (txn.type === 'LIMIT_BUY' || txn.type === 'LIMIT_SELL'))
      )
    : transactions;

  if (filteredTransactions.length === 0) {
    return (
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-medium text-white">{title}</h3>
        </div>
        <div className="text-center py-8">
          <p className="text-gray-400 text-sm">No transactions found</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-medium text-white">{title}</h3>
      </div>
      
      <div className="space-y-0">
        {filteredTransactions.map((txn, index) => (
          <div key={txn.id}>
            <div 
              className={`flex items-center justify-between py-3 ${onTransactionClick ? 'cursor-pointer hover:bg-gray-800/50 -mx-2 px-2 rounded-lg transition-colors' : ''}`}
              onClick={() => handleTransactionClick(txn)}
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                  {getTransactionIcon(txn.type)}
                </div>
                <div>
                  <p className="text-sm font-light text-white">{getTransactionLabel(txn.type, txn.status)}</p>
                  <p className="text-xs text-gray-400">{formatRelativeTime(txn.executed_at || txn.created_at || '')}</p>
                </div>
              </div>
              
              <div className="text-right">
                <p className="text-sm font-light text-white">
                  {getTransactionAmount(txn)}
                </p>
                {getTransactionSubAmount(txn) && (
                  <p className="text-xs text-gray-400">
                    {getTransactionSubAmount(txn)}
                  </p>
                )}
              </div>
            </div>
            {index < filteredTransactions.length - 1 && (
              <div className="border-b border-gray-800"></div>
            )}
          </div>
        ))}
      </div>
      
      {/* Details Modal */}
      {selectedTransaction && (
        <DetailsModal
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          title={getTransactionLabel(selectedTransaction.type, selectedTransaction.status)}
          mainDetail={getTransactionAmount(selectedTransaction)}
          subDetail={getTransactionSubAmount(selectedTransaction)}
          transactionDetails={getTransactionDetails(selectedTransaction)}
          dcaPlanDetails={[]}
        />
      )}
    </div>
  );
};

export default AdminTransactionList;

