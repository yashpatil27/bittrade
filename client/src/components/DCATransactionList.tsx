import React from 'react';
import { Transaction } from '../types';
import TransactionList from './TransactionList';

interface DCATransactionListProps {
  onTransactionClick?: (transaction: Transaction) => void;
  maxItems?: number;
}

const DCATransactionList: React.FC<DCATransactionListProps> = ({ onTransactionClick, maxItems }) => {
  return (
    <TransactionList
      title="DCA Transactions"
      filterDCA={true}
      onTransactionClick={onTransactionClick}
      maxItems={maxItems}
      showCount={true}
      wrapInCard={true}
      showViewAll={false}
    />
  );
};

export default DCATransactionList;
