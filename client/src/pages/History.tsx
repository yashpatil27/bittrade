import React from 'react';
import Header from '../components/Header';
import Card from '../components/Card';
import TransactionList from '../components/TransactionList';
import { Transaction } from '../types';

const History: React.FC = () => {
  const handleTransactionClick = (transaction: Transaction) => {
    // Handle transaction click - could open a transaction details modal
    console.log('Transaction clicked:', transaction);
  };

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-md mx-auto bg-black min-h-screen">
        <Header title="₿itTrade" />
        
        {/* Main Content */}
        <div className="px-4 py-3 space-y-3">
          {/* Pending Orders - Only shown when there are pending limit orders */}
          <TransactionList 
            title="Pending Orders"
            filterPending={true}
            showTargetPrice={true}
            showCount={true}
            showViewAll={false}
            wrapInCard={true}
            onTransactionClick={handleTransactionClick}
          />
          
          {/* All Transactions */}
          <Card>
            <TransactionList 
              title="All Transactions"
              showViewAll={false}
              excludePending={true}
              onTransactionClick={handleTransactionClick}
            />
          </Card>
        </div>
      </div>
    </div>
  );
};

export default History;
