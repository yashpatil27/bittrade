import React from 'react';
import Card from '../../components/Card';
import TransactionList from '../../components/TransactionList';
import PendingOrdersList from '../../components/PendingOrdersList';
import DCAPlans from '../../components/DCAPlans';
import { Transaction, DCAPlan } from '../../types';

const AdminHistory: React.FC = () => {
  const handleTransactionClick = (transaction: Transaction) => {
    console.log('Admin transaction clicked:', transaction);
  };

  const handlePlanClick = (plan: DCAPlan) => {
    console.log('Admin DCA Plan clicked:', plan);
  };

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-md mx-auto bg-black min-h-screen">
        {/* Main Content */}
        <div className="px-4 py-3 space-y-3">
          {/* DCA Plans */}
          <DCAPlans
            title="All DCA Plans"
            onPlanClick={handlePlanClick}
            wrapInCard={true}
            showAllUsers={true}
            disableActions={true}
          />
          
          {/* Pending Orders - Only shown when there are pending limit orders */}
          <PendingOrdersList 
            onTransactionClick={handleTransactionClick}
            showAllUsers={true}
            disableActions={true}
          />
          
          {/* All Transactions */}
          <Card>
            <TransactionList 
              title="All Transactions (All Users)"
              showViewAll={false}
              excludePending={true}
              onTransactionClick={handleTransactionClick}
              showAllUsers={true}
              disableActions={true}
            />
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminHistory;
