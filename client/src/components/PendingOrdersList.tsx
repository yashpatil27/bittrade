import React from 'react';
import TransactionList from './TransactionList';
import { Transaction } from '../types';

interface PendingOrdersListProps {
  onTransactionClick?: (transaction: Transaction) => void;
  showViewAll?: boolean;
  wrapInCard?: boolean;
}

const PendingOrdersList: React.FC<PendingOrdersListProps> = ({
  onTransactionClick,
  showViewAll = false,
  wrapInCard = true
}) => {
  return (
    <TransactionList 
      title="Pending Orders"
      filterPending={true}
      showTargetPrice={true}
      showCount={true}
      showViewAll={showViewAll}
      wrapInCard={wrapInCard}
      onTransactionClick={onTransactionClick}
    />
  );
};

export default PendingOrdersList;
