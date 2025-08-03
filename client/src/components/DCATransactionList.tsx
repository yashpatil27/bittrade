import React, { useState } from 'react';
import { ArrowUpRight, ArrowDownRight, Bitcoin } from 'lucide-react';
import { getTimeAgo } from '../utils/dateUtils';
import { formatRupeesForDisplay, formatBitcoinForDisplay } from '../utils/formatters';
import { Transaction } from '../types';
import useTransactionUpdates from '../hooks/useTransactionUpdates';
import Card from './Card';
import DetailsModal from './DetailsModal';

interface DCATransactionListProps {
  onTransactionClick?: (transaction: Transaction) => void;
  maxItems?: number;
}

const DCATransactionList: React.FC<DCATransactionListProps> = ({ onTransactionClick, maxItems }) => {
  const { transactions, isLoading, error } = useTransactionUpdates();
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  // Filter transactions to only show DCA_BUY and DCA_SELL
  const dcaTransactions = transactions.filter(
    txn => txn.type === 'DCA_BUY' || txn.type === 'DCA_SELL'
  );

  const displayTransactions = maxItems ? dcaTransactions.slice(0, maxItems) : dcaTransactions;

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'DCA_BUY':
        return <ArrowUpRight className="w-4 h-4" />;
      case 'DCA_SELL':
        return <ArrowDownRight className="w-4 h-4" />;
      default:
        return <div className="w-4 h-4" />;
    }
  };

  const getTransactionLabel = (type: string) => {
    switch (type) {
      case 'DCA_BUY':
        return 'DCA Bitcoin Purchase';
      case 'DCA_SELL':
        return 'DCA Bitcoin Sale';
      default:
        return type || 'Unknown Transaction';
    }
  };

  const getTransactionAmount = (txn: Transaction) => {
    return formatBitcoinForDisplay(txn.btc_amount || 0);
  };

  const getTransactionSubAmount = (txn: Transaction) => {
    return formatRupeesForDisplay(txn.inr_amount || 0);
  };

  const handleTransactionClick = (transaction: Transaction) => {
    if (onTransactionClick) {
      setSelectedTransaction(transaction);
      setIsDetailsModalOpen(true);
    }
  };

  const getTransactionDetails = (txn: Transaction) => {
    const details = [
      { label: 'Transaction ID', value: txn.id, highlight: false },
      { label: 'Status', value: txn.status, highlight: true },
    ];

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

  if (isLoading) {
    return (
      <Card>
        <div className="text-center py-8">
          <p className="text-gray-400 text-sm">
            Loading DCA transactions...
          </p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <div className="text-center py-8">
          <p className="text-red-500 text-sm">
            Error: {error}
          </p>
        </div>
      </Card>
    );
  }

  if (displayTransactions.length === 0) {
    return (
      <Card>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-medium text-white">DCA Transactions</h3>
        </div>
        <div className="text-center py-8">
          <div className="w-12 h-12 bg-brand/10 rounded-full flex items-center justify-center mx-auto mb-3">
            <Bitcoin className="w-6 h-6 text-brand" />
          </div>
          <h4 className="text-white font-medium mb-1">No DCA transactions yet</h4>
          <p className="text-gray-400 text-xs">Create a DCA plan to start automated investing</p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <h3 className="text-base font-medium text-white">DCA Transactions</h3>
          {displayTransactions.length > 0 && (
            <span className="bg-brand text-black text-xs px-2 py-0.5 rounded-full font-medium">
              {displayTransactions.length}
            </span>
          )}
        </div>
      </div>
      
      <div className="space-y-0">
        {displayTransactions.map((txn, index) => (
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
                  <p className="text-sm font-light text-white">{getTransactionLabel(txn.type)}</p>
                  <p className="text-xs text-gray-400">{getTimeAgo(txn.executed_at || txn.created_at || '')}</p>
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
            {index < displayTransactions.length - 1 && (
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
    </Card>
  );
};

export default DCATransactionList;
