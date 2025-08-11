import React, { useState, useEffect } from 'react';
import { Target, CalendarSync, ArrowDown, ArrowUp, Zap, Plus, Bitcoin, IndianRupee } from 'lucide-react';
import { formatRelativeTime } from '../utils/dateUtils';
import { formatRupeesForDisplay, formatBitcoinForDisplay } from '../utils/formatters';
import { cancelLimitOrder, reverseTransaction } from '../utils/api';
import { Transaction } from '../types';
import { usePortfolio } from '../context/PortfolioContext';
import Card from './Card';

// Lazy load DetailsModal
import DetailsModal from './DetailsModal';

interface TransactionListProps {
  title?: string;
  showViewAll?: boolean;
  onTransactionClick?: (transaction: Transaction) => void;
  onViewAllClick?: () => void;
  maxItems?: number;
  filterPending?: boolean; // If true, only show pending limit orders
  excludePending?: boolean; // If true, exclude pending limit orders from the list
  filterDCA?: boolean; // If true, only show DCA transactions
  showTargetPrice?: boolean; // If true, show target price for pending orders
  showCount?: boolean; // If true, show count badge next to title
  wrapInCard?: boolean; // If true, wrap content in Card component
  showAllUsers?: boolean; // If true, use admin data source (all users)
  disableActions?: boolean; // If true, disable cancel order functionality
}

const TransactionList: React.FC<TransactionListProps> = ({
  title = 'Transactions',
  showViewAll = true,
  onTransactionClick,
  onViewAllClick,
  maxItems,
  filterPending = false,
  excludePending = false,
  filterDCA = false,
  showTargetPrice = false,
  showCount = false,
  wrapInCard = false,
  showAllUsers = false,
  disableActions = false
}) => {
  // Use new PortfolioContext
  const {
    userTransactions,
    adminTransactions,
    loading,
    errors,
    refetchUserTransactions,
    refetchAdminTransactions,
    getPendingOrders,
    getCompletedTransactions,
    getDCATransactions
  } = usePortfolio();
  
  // Get appropriate data based on showAllUsers prop
  const transactions = showAllUsers ? adminTransactions : userTransactions;
  const isLoading = showAllUsers ? loading.adminTransactions : loading.userTransactions;
  const error = showAllUsers ? errors.adminTransactions : errors.userTransactions;
  const fetchTransactions = showAllUsers ? refetchAdminTransactions : refetchUserTransactions;
  
  // Fetch admin transactions if needed
  useEffect(() => {
    if (showAllUsers && adminTransactions.length === 0 && !loading.adminTransactions) {
      refetchAdminTransactions();
    }
  }, [showAllUsers, adminTransactions.length, loading.adminTransactions, refetchAdminTransactions]);
  
  // DetailsModal state
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  
  // Load More state - only used when maxItems is not provided
  const [showAll, setShowAll] = useState(false);
  const INITIAL_LOAD_COUNT = 10;
  
  // Use centralized filtering functions for better performance
  const filteredTransactions = filterPending 
    ? getPendingOrders(showAllUsers)
    : excludePending 
    ? getCompletedTransactions(showAllUsers)
    : filterDCA
    ? getDCATransactions(showAllUsers)
    : transactions;
  
  // Determine how many transactions to display
  const getDisplayTransactions = () => {
    if (maxItems) {
      // If maxItems is provided, use it (for components like Home)
      return filteredTransactions.slice(0, maxItems);
    } else {
      // If no maxItems, implement Load More functionality
      return showAll ? filteredTransactions : filteredTransactions.slice(0, INITIAL_LOAD_COUNT);
    }
  };
  
  const displayTransactions = getDisplayTransactions();
  const hasMoreTransactions = !maxItems && !showAll && filteredTransactions.length > INITIAL_LOAD_COUNT;


  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'MARKET_BUY':
        return <Bitcoin className="w-4 h-4" />;
      case 'MARKET_SELL':
        return <IndianRupee className="w-4 h-4" />;
      case 'LIMIT_BUY':
      case 'LIMIT_SELL':
        return <Target className="w-4 h-4" />;
      case 'DCA_BUY':
      case 'DCA_SELL':
        return <CalendarSync className="w-4 h-4" />;
      case 'DEPOSIT_INR':
      case 'DEPOSIT_BTC':
        return <ArrowDown className="w-4 h-4" />;
      case 'WITHDRAW_INR':
      case 'WITHDRAW_BTC':
        return <ArrowUp className="w-4 h-4" />;
      case 'LOAN_BORROW':
        return <ArrowDown className="w-4 h-4" />;
      case 'LOAN_REPAY':
        return <ArrowUp className="w-4 h-4" />;
      case 'LIQUIDATION':
      case 'PARTIAL_LIQUIDATION':
      case 'FULL_LIQUIDATION':
        return <Zap className="w-4 h-4" />;
      case 'INTEREST_ACCRUAL':
        return <Plus className="w-4 h-4" />;
      default: return <div className="w-4 h-4" />;
    }
  };

  const getTransactionColor = (type: string, status?: string) => {
    // Use consistent grey for all transaction types
    return 'bg-gray-800';
  };

  const handleTransactionClick = (transaction: Transaction) => {
    // Open DetailsModal if onTransactionClick prop is provided
    if (onTransactionClick) {
      setSelectedTransaction(transaction);
      setIsDetailsModalOpen(true);
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

  const getTransactionDetails = (txn: Transaction) => {
    const details = [
      { label: 'Transaction ID', value: txn.id, highlight: false },
      { label: 'Status', value: txn.status, highlight: true },
    ];

    // Add user information for admin mode
    if (showAllUsers && txn.user_name && txn.user_email) {
      details.push({ label: 'User Name', value: txn.user_name, highlight: false });
      details.push({ label: 'User Email', value: txn.user_email, highlight: false });
    }

    if (txn.execution_price) {
      details.push({ label: 'Execution Price', value: formatRupeesForDisplay(txn.execution_price), highlight: false });
    }

    if (txn.fee) {
      details.push({ label: 'Fee', value: formatRupeesForDisplay(txn.fee), highlight: false });
    }

    if (txn.executed_at) {
      details.push({ label: 'Executed At', value: new Date(txn.executed_at).toLocaleString(), highlight: false });
    }

    if (txn.created_at) {
      details.push({ label: 'Created At', value: new Date(txn.created_at).toLocaleString(), highlight: false });
    }

    return details;
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
    const emptyMessage = filterDCA 
      ? { title: "No DCA transactions yet", subtitle: "Create a DCA plan to start automated investing" }
      : { title: "No transactions yet", subtitle: "Start trading to see your history" };
    
    return (
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-medium text-white">{title}</h3>
        </div>
        <div className="text-center py-8">
          <div className="w-12 h-12 bg-brand/10 rounded-full flex items-center justify-center mx-auto mb-3">
            <Bitcoin className="w-6 h-6 text-brand" />
          </div>
          <h4 className="text-white font-medium mb-1">{emptyMessage.title}</h4>
          <p className="text-gray-400 text-xs">{emptyMessage.subtitle}</p>
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
                <div className={`w-8 h-8 ${getTransactionColor(txn.type, txn.status)} rounded-lg flex items-center justify-center`}>
                  {getTransactionIcon(txn.type)}
                </div>
                <div>
                  <p className="text-sm font-light text-white">{getTransactionLabel(txn.type, txn.status)}</p>
                  {showTargetPrice && txn.status === 'PENDING' && txn.execution_price ? (
                    <div className="flex items-center space-x-2 text-xs text-gray-400">
                      <span>Target: {formatRupeesForDisplay(txn.execution_price)}</span>
                      <span>•</span>
                      <span>{formatRelativeTime(txn.created_at || '')}</span>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400">{formatRelativeTime(txn.executed_at || txn.created_at || '')}</p>
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
      
      {/* Load More Button */}
      {hasMoreTransactions && (
        <div className="mt-4 text-center">
          <button 
            onClick={() => setShowAll(true)}
            className="text-brand text-sm font-medium hover:text-brand/80 transition-colors"
          >
            Load More ({filteredTransactions.length - INITIAL_LOAD_COUNT} more)
          </button>
        </div>
      )}
      
      {/* Details Modal */}
      {selectedTransaction && isDetailsModalOpen && (
        <DetailsModal
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          title={getTransactionLabel(selectedTransaction.type, selectedTransaction.status)}
          mainDetail={getTransactionAmount(selectedTransaction)}
          subDetail={getTransactionSubAmount(selectedTransaction)}
          transactionDetails={getTransactionDetails(selectedTransaction)}
          dcaPlanDetails={[]}
          actionButtons={(() => {
            const buttons = [];
            
            // Cancel Order button for pending limit orders
            if (!disableActions && selectedTransaction.status === 'PENDING' && 
                (selectedTransaction.type === 'LIMIT_BUY' || selectedTransaction.type === 'LIMIT_SELL')) {
              buttons.push({
                label: 'Cancel Order',
                onClick: async () => {
                  try {
                    await cancelLimitOrder(selectedTransaction.id);
                    fetchTransactions();
                    setIsDetailsModalOpen(false);
                  } catch (error) {
                    console.error('Failed to cancel limit order:', error);
                  }
                },
                variant: 'danger' as const
              });
            }
            
            // Reverse Transaction button for admins on executed transactions
            if (showAllUsers && selectedTransaction.status === 'EXECUTED') {
              buttons.push({
                label: 'Reverse Transaction',
                onClick: async () => {
                  try {
                    await reverseTransaction(selectedTransaction.id);
                    fetchTransactions();
                    setIsDetailsModalOpen(false);
                  } catch (error) {
                    console.error('Failed to reverse transaction:', error);
                    // TODO: Show error message to user
                  }
                },
                variant: 'warning' as const
              });
            }
            
            return buttons.length > 0 ? buttons : undefined;
          })()
          }
        />
      )}
    </div>
  );
  
  return wrapInCard ? <Card>{content}</Card> : content;
};

export default TransactionList;
