import React, { useState, useEffect } from 'react';
import SingleInputModal from './SingleInputModal';
import ConfirmationModal from './ConfirmationModal';
import { formatRupeesForDisplay } from '../utils/formatters';
import { getApiUrl } from '../utils/api';
import { AnimateINR } from './AnimateNumberFlow';

interface UserWithBalance {
  id: string;
  name: string;
  email: string;
  btcBalance: number;
  inrBalance: number;
  is_admin?: boolean;
}

interface DepositCashModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserWithBalance | null;
  onComplete?: (user: UserWithBalance, amount: string) => void;
}

const DepositCashModal: React.FC<DepositCashModalProps> = ({
  isOpen,
  onClose,
  user,
  onComplete,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isWithdrawMode, setIsWithdrawMode] = useState(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setInputValue('');
      setIsProcessing(false);
      setShowConfirmation(false);
    }
  }, [isOpen]);

  // Handle mode toggle
  const handleModeToggle = () => {
    setIsWithdrawMode(!isWithdrawMode);
    setInputValue('');
    setShowConfirmation(false);
  };

  // Handle input modal confirmation
  const handleInputConfirm = (value: string) => {
    const numValue = parseFloat(value);
    
    if (numValue <= 0) {
      alert('Please enter a valid amount greater than 0.');
      return;
    }

    // Check balance for withdraw mode
    if (isWithdrawMode && user) {
      if (numValue > user.inrBalance) {
        alert('Insufficient cash balance for withdrawal.');
        return;
      }
    }

    setInputValue(value);
    setShowConfirmation(true);
  };

  // Handle input modal close
  const handleInputClose = () => {
    onClose();
  };

  // Handle confirmation modal confirm
  const handleConfirmationConfirm = async () => {
    if (!user) return;
    
    setIsProcessing(true);
    
    try {
      // Call API based on mode
      const endpoint = isWithdrawMode ? 'withdraw-cash' : 'deposit-cash';
      const response = await fetch(`${getApiUrl()}/api/admin/users/${user.id}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('bittrade_token')}`
        },
        body: JSON.stringify({
          amount: parseFloat(inputValue) // INR is stored directly as rupees
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to ${isWithdrawMode ? 'withdraw' : 'deposit'} cash`);
      }

      const result = await response.json();
      console.log(`✅ Cash ${isWithdrawMode ? 'withdrawal' : 'deposit'} successful:`, result);
      
      // Call completion callback
      if (onComplete) {
        onComplete(user, inputValue);
      }
      
      // Close entire modal flow
      onClose();
    } catch (error) {
      console.error(`❌ Cash ${isWithdrawMode ? 'withdrawal' : 'deposit'} failed:`, error);
      
      // Show error message to user
      const errorMessage = error instanceof Error ? error.message : `Cash ${isWithdrawMode ? 'withdrawal' : 'deposit'} failed`;
      alert(`${isWithdrawMode ? 'Withdrawal' : 'Deposit'} failed: ${errorMessage}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle confirmation modal cancel/close
  const handleConfirmationClose = () => {
    // Hide confirmation modal, SingleInputModal stays open
    setShowConfirmation(false);
  };

  // Get confirmation details
  const getConfirmationDetails = () => {
    if (!inputValue || !user) return [];
    
    const inrAmount = parseFloat(inputValue);
    const operation = isWithdrawMode ? 'subtract' : 'add';
    const newBalance = isWithdrawMode ? user.inrBalance - inrAmount : user.inrBalance + inrAmount;
    
    return [
      {
        label: 'User',
        value: user.name,
        highlight: false
      },
      {
        label: 'Email',
        value: user.email,
        highlight: false
      },
      {
        label: `${isWithdrawMode ? 'Withdraw' : 'Deposit'} Amount`,
        value: <AnimateINR value={inrAmount} className="text-sm font-normal text-white" />,
        highlight: true
      },
      {
        label: 'Current Balance',
        value: formatRupeesForDisplay(user.inrBalance),
        highlight: false
      },
      {
        label: 'New Balance',
        value: formatRupeesForDisplay(newBalance),
        highlight: true
      }
    ];
  };

  if (!user) return null;

  return (
    <>
      {/* Input Modal - Always open when main modal is open */}
      <SingleInputModal
        isOpen={isOpen}
        onClose={handleInputClose}
        title={isWithdrawMode ? "Withdraw Cash" : "Deposit Cash"}
        type="inr"
        confirmText="Next"
        onConfirm={handleInputConfirm}
        sectionTitle={`${isWithdrawMode ? 'Withdraw from' : 'Deposit for'} ${user.name}`}
        sectionDetail={isWithdrawMode ? `Remove cash from ${user.name}'s balance` : `Add cash to ${user.name}'s balance`}
        initialValue={inputValue}
        onSectionClick={handleModeToggle}
      />

      {/* Confirmation Modal - Opens on top of SingleInputModal */}
      <ConfirmationModal
        isOpen={isOpen && showConfirmation}
        onClose={handleConfirmationClose}
        title={isWithdrawMode ? "Confirm Cash Withdrawal" : "Confirm Cash Deposit"}
        amount={inputValue ? (
          <AnimateINR value={parseFloat(inputValue)} className="justify-center text-white text-5xl font-normal" />
        ) : undefined}
        amountType="inr"
        details={getConfirmationDetails()}
        confirmText={isWithdrawMode ? "Withdraw Cash" : "Deposit Cash"}
        onConfirm={handleConfirmationConfirm}
        isLoading={isProcessing}
        mode="confirm"
      />
    </>
  );
};

export default DepositCashModal;
