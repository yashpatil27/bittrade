import React from 'react';
import Header from '../components/Header';
import Card from '../components/Card';
import TransactionList from '../components/TransactionList';
import { mockTransactions } from '../data/mockData';
import { Transaction } from '../types';

const History: React.FC = () => {
  const [transactions] = React.useState<Transaction[]>(mockTransactions);

  const handleTransactionClick = (transaction: Transaction) => {
    // Handle transaction click - could open a transaction details modal
    console.log('Transaction clicked:', transaction);
  };

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-md mx-auto bg-black min-h-screen">
        <Header title="₿itTrade" />
        
        {/* Main Content */}
        <div className="px-4 py-3">
          <Card>
            <TransactionList 
              transactions={transactions}
              title="All Transactions"
              showViewAll={false}
              onTransactionClick={handleTransactionClick}
            />
          </Card>
        </div>
      </div>
    </div>
  );
};

export default History;
