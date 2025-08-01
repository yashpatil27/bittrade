import React from 'react';
import TransactionList from './TransactionList';
import { Transaction } from '../types';

interface PendingOrdersListProps {
  onTransactionClick?: (transaction: Transaction) => void;
  showViewAll?: boolean;
  wrapInCard?: boolean;
  showAllUsers?: boolean; // If true, show pending orders from all users (admin view)
  disableActions?: boolean; // If true, disable cancel order functionality
}

const PendingOrdersList: React.FC<PendingOrdersListProps> = ({
  onTransactionClick,
  showViewAll = false,
  wrapInCard = true,
  showAllUsers = false,
  disableActions = false
}) => {
  const title = showAllUsers ? "All Pending Orders" : "Pending Orders";
  
  return (
    <TransactionList 
      title={title}
      filterPending={true}
      showTargetPrice={true}
      showCount={true}
      showViewAll={showViewAll}
      wrapInCard={wrapInCard}
      onTransactionClick={onTransactionClick}
      showAllUsers={showAllUsers}
      disableActions={disableActions}
    />
  );
};

export default PendingOrdersList;
