import React from 'react';
import Card from '../../components/Card';
import AdminTransactionList from '../../components/AdminTransactionList';
import AdminPendingOrdersList from '../../components/AdminPendingOrdersList';
import AdminDCAPlans from '../../components/AdminDCAPlans';
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
          <AdminDCAPlans
            title="All DCA Plans"
            onPlanClick={handlePlanClick}
            wrapInCard={true}
          />
          
          {/* Pending Orders - Only shown when there are pending limit orders */}
          <AdminPendingOrdersList 
            onTransactionClick={handleTransactionClick}
          />
          
          {/* All Transactions */}
          <Card>
            <AdminTransactionList 
              title="All Transactions (All Users)"
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

export default AdminHistory;
