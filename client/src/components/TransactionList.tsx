import React, { useEffect } from 'react';
import { ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { getTimeAgo } from '../data/mockData';
import { formatRupeesForDisplay, formatBitcoinForDisplay } from '../utils/formatters';
import { Transaction } from '../types';
import useTransactionUpdates from '../hooks/useTransactionUpdates';
import Card from './Card';

interface TransactionListProps {
  title?: string;
  showViewAll?: boolean;
  onTransactionClick?: (transaction: Transaction) => void;
  onViewAllClick?: () => void;
  maxItems?: number;
  filterPending?: boolean; // If true, only show pending limit orders
  excludePending?: boolean; // If true, exclude pending limit orders from the list
  showTargetPrice?: boolean; // If true, show target price for pending orders
  showCount?: boolean; // If true, show count badge next to title
  wrapInCard?: boolean; // If true, wrap content in Card component
}

const TransactionList: React.FC<TransactionListProps> = ({
  title = 'Transactions',
  showViewAll = true,
  onTransactionClick,
  onViewAllClick,
  maxItems,
  filterPending = false,
  excludePending = false,
  showTargetPrice = false,
  showCount = false,
  wrapInCard = false
}) => {
  const { transactions, isLoading, error, fetchTransactions, page } = useTransactionUpdates();
  
  // Filter transactions based on filterPending and excludePending props
  const filteredTransactions = filterPending 
    ? transactions.filter(txn => 
        txn.status === 'PENDING' && (txn.type === 'LIMIT_BUY' || txn.type === 'LIMIT_SELL')
      )
    : excludePending 
    ? transactions.filter(txn => 
        !(txn.status === 'PENDING' && (txn.type === 'LIMIT_BUY' || txn.type === 'LIMIT_SELL'))
      )
    : transactions;
  
  const displayTransactions = maxItems ? filteredTransactions.slice(0, maxItems) : filteredTransactions;


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

  const getTransactionColor = (type: string, status?: string) => {
    // Use consistent grey for all transaction types
    return 'bg-gray-600';
  };

  const handleTransactionClick = (transaction: Transaction) => {
    if (onTransactionClick) {
      onTransactionClick(transaction);
    }
  };

  const handleViewAllClick = () => {
    if (onViewAllClick) {
      onViewAllClick();
    }
  };

  const getTransactionLabel = (type: string, status?: string) => {
    // Simplified labels for pending orders in filterPending mode
    if (filterPending && status === 'PENDING') {
      switch (type) {
        case 'LIMIT_BUY':
          return 'Limit Buy Order';
        case 'LIMIT_SELL':
          return 'Limit Sale Order';
      }
    }
    
    // Default labels for all other cases
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
      case 'LOAN_CREATE':
        return 'Collateral Deposit';
      case 'LOAN_BORROW':
        return 'Cash Borrowed';
      case 'LOAN_REPAY':
        return 'Loan Repaid';
      case 'LOAN_ADD_COLLATERAL':
        return 'Collateral Added';
      case 'LIQUIDATION':
        return 'Loan Liquidation (Auto)';
      case 'PARTIAL_LIQUIDATION':
        return 'Loan Liquidation (Manual)';
      case 'FULL_LIQUIDATION':
        return 'Loan Liquidation (Manual)';
      case 'INTEREST_ACCRUAL':
        return 'Interest Accrued';
      case 'DEPOSIT_INR':
        return 'Cash Deposit';
      case 'WITHDRAW_INR':
        return 'Cash Withdrawal';
      case 'DEPOSIT_BTC':
        return 'Bitcoin Deposit';
      case 'WITHDRAW_BTC':
        return 'Bitcoin Withdrawal';
      default:
        return type || 'Unknown Transaction';
    }
  };

  const getTransactionAmount = (txn: Transaction) => {
    // Main amount based on transaction type
    switch (txn.type) {
      case 'LOAN_BORROW':
      case 'LOAN_REPAY':
      case 'INTEREST_ACCRUAL':
      case 'DEPOSIT_INR':
      case 'WITHDRAW_INR':
        return formatRupeesForDisplay(txn.inr_amount || 0);
      default:
        // All other transactions show BTC as main amount
        return formatBitcoinForDisplay(txn.btc_amount || 0);
    }
  };

  const getTransactionSubAmount = (txn: Transaction) => {
    // Sub-amount based on transaction type
    switch (txn.type) {
      case 'MARKET_BUY':
      case 'MARKET_SELL':
      case 'LIMIT_BUY':
      case 'LIMIT_SELL':
      case 'DCA_BUY':
      case 'DCA_SELL':
      case 'LIQUIDATION':
      case 'PARTIAL_LIQUIDATION':
      case 'FULL_LIQUIDATION':
        return formatRupeesForDisplay(txn.inr_amount || 0);
      case 'LOAN_CREATE':
      case 'LOAN_ADD_COLLATERAL':
      case 'LOAN_BORROW':
      case 'LOAN_REPAY':
      case 'INTEREST_ACCRUAL':
      case 'DEPOSIT_INR':
      case 'WITHDRAW_INR':
      case 'DEPOSIT_BTC':
      case 'WITHDRAW_BTC':
      default:
        return null; // No sub-amount for these transaction types
    }
  };


  // Removed the problematic useEffect that was causing infinite fetching

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400 text-sm">
          Loading transactions...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 text-sm">
          Error: {error}
        </p>
      </div>
    );
  }

  // Don't render anything if filtering for pending orders and none exist
  if (filterPending && displayTransactions.length === 0) {
    return null;
  }
  
  // Show "no transactions" message for regular transaction lists
  if (!filterPending && displayTransactions.length === 0) {
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

  const content = (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <h3 className="text-base font-medium text-white">{title}</h3>
          {showCount && displayTransactions.length > 0 && (
            <span className="bg-brand text-black text-xs px-2 py-0.5 rounded-full font-medium">
              {displayTransactions.length}
            </span>
          )}
        </div>
        {showViewAll && (
          <button 
            className="text-xs font-light text-brand"
            onClick={handleViewAllClick}
          >
            View All
          </button>
        )}
      </div>
      
      <div className="space-y-0">
        {displayTransactions.map((txn, index) => (
          <div key={txn.id}>
            <div 
              className={`flex items-center justify-between py-3 ${onTransactionClick ? 'cursor-pointer hover:bg-gray-800/50 -mx-2 px-2 rounded-lg transition-colors' : ''}`}
              onClick={() => handleTransactionClick(txn)}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 ${getTransactionColor(txn.type, txn.status)} rounded-full flex items-center justify-center`}>
                  {getTransactionIcon(txn.type)}
                </div>
                <div>
                  <p className="text-sm font-light text-white">{getTransactionLabel(txn.type, txn.status)}</p>
                  {showTargetPrice && txn.status === 'PENDING' && txn.execution_price ? (
                    <div className="flex items-center space-x-2 text-xs text-gray-400">
                      <span>Target: {formatRupeesForDisplay(txn.execution_price)}</span>
                      <span>•</span>
                      <span>{getTimeAgo(txn.created_at || '')}</span>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400">{getTimeAgo(txn.executed_at || txn.created_at || '')}</p>
                  )}
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
            {index < displayTransactions.length - 1 && (
              <div className="border-b border-gray-800"></div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
  
  return wrapInCard ? <Card>{content}</Card> : content;
};

export default TransactionList;
