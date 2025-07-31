import React from 'react';
import Card from '../components/Card';
import TransactionList from '../components/TransactionList';
import PendingOrdersList from '../components/PendingOrdersList';
import DCAPlans from '../components/DCAPlans';
import { Transaction, DCAPlan } from '../types';

const History: React.FC = () => {
  const handleTransactionClick = (transaction: Transaction) => {
    // Handle transaction click - could open a transaction details modal
    console.log('Transaction clicked:', transaction);
  };

  const handlePlanClick = (plan: DCAPlan) => {
    console.log('DCA Plan clicked:', plan);
    // TODO: Add plan details modal or navigation
  };

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-md mx-auto bg-black min-h-screen">
        {/* Main Content */}
      <div className="px-4 py-3 space-y-3">
          {/* DCA Plans */}
          <DCAPlans
            title="DCA Plans"
            onPlanClick={handlePlanClick}
            wrapInCard={true}
          />
          
          {/* Pending Orders - Only shown when there are pending limit orders */}
          <PendingOrdersList 
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
