import React, { useState } from 'react';
import { Clock } from 'lucide-react';
import { formatRelativeTime } from '../utils/dateUtils';
import { formatRupeesForDisplay, formatBitcoinForDisplay } from '../utils/formatters';
import { Transaction } from '../types';
import useAllTransactions from '../hooks/useAllTransactions';
import Card from './Card';
import DetailsModal from './DetailsModal';

interface AdminPendingOrdersListProps {
  onTransactionClick?: (transaction: Transaction) => void;
}

const AdminPendingOrdersList: React.FC<AdminPendingOrdersListProps> = ({
  onTransactionClick,
}) => {
  const { transactions, isLoading, error } = useAllTransactions();
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  // Filter for pending limit orders only
  const pendingOrders = transactions.filter(txn => 
    txn.status === 'PENDING' && (txn.type === 'LIMIT_BUY' || txn.type === 'LIMIT_SELL')
  );

  const handleTransactionClick = (transaction: Transaction) => {
    if (onTransactionClick) {
      setSelectedTransaction(transaction);
      setIsDetailsModalOpen(true);
    }
  };

  const getTransactionLabel = (type: string) => {
    switch (type) {
      case 'LIMIT_BUY':
        return 'Limit Buy Order';
      case 'LIMIT_SELL':
        return 'Limit Sale Order';
      default:
        return type;
    }
  };

  const getTransactionAmount = (txn: Transaction) => {
    return formatBitcoinForDisplay(txn.btc_amount || 0);
  };

  const getTransactionSubAmount = (txn: Transaction) => {
    return formatRupeesForDisplay(txn.inr_amount || 0);
  };

  const getTransactionDetails = (txn: Transaction) => {
    return [
      { label: 'Transaction ID', value: txn.id, highlight: false },
      { label: 'Status', value: txn.status, highlight: true },
      { label: 'Target Price', value: formatRupeesForDisplay(txn.execution_price || 0), highlight: false },
      { label: 'Created At', value: new Date(txn.created_at || '').toLocaleString(), highlight: false },
    ];
  };

  if (isLoading) {
    return null;
  }

  if (error) {
    return null;
  }

  // Don't render if no pending orders
  if (pendingOrders.length === 0) {
    return null;
  }

  return (
    <Card>
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <h3 className="text-base font-medium text-white">All Pending Orders</h3>
            <span className="bg-brand text-black text-xs px-2 py-0.5 rounded-full font-medium">
              {pendingOrders.length}
            </span>
          </div>
        </div>
        
        <div className="space-y-0">
          {pendingOrders.map((txn, index) => (
            <div key={txn.id}>
              <div 
                className={`flex items-center justify-between py-3 ${onTransactionClick ? 'cursor-pointer hover:bg-gray-800/50 -mx-2 px-2 rounded-lg transition-colors' : ''}`}
                onClick={() => handleTransactionClick(txn)}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-light text-white">{getTransactionLabel(txn.type)}</p>
                    <div className="flex items-center space-x-2 text-xs text-gray-400">
                      <span>Target: {formatRupeesForDisplay(txn.execution_price || 0)}</span>
                      <span>•</span>
                      <span>{formatRelativeTime(txn.created_at || '')}</span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-sm font-light text-white">
                    {getTransactionAmount(txn)}
                  </p>
                  <p className="text-xs text-gray-400">
                    {getTransactionSubAmount(txn)}
                  </p>
                </div>
              </div>
              {index < pendingOrders.length - 1 && (
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
            title={getTransactionLabel(selectedTransaction.type)}
            mainDetail={getTransactionAmount(selectedTransaction)}
            subDetail={getTransactionSubAmount(selectedTransaction)}
            transactionDetails={getTransactionDetails(selectedTransaction)}
            dcaPlanDetails={[]}
          />
        )}
      </div>
    </Card>
  );
};

export default AdminPendingOrdersList;
