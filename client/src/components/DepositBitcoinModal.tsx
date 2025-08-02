import React, { useState, useEffect } from 'react';
import SingleInputModal from './SingleInputModal';
import ConfirmationModal from './ConfirmationModal';
import { formatBitcoinForDisplay } from '../utils/formatters';
import { getApiUrl } from '../utils/api';
import { AnimateBTC } from './AnimateNumberFlow';

interface UserWithBalance {
  id: string;
  name: string;
  email: string;
  btcBalance: number;
  inrBalance: number;
  is_admin?: boolean;
}

interface DepositBitcoinModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserWithBalance | null;
  onComplete?: (user: UserWithBalance, amount: string) => void;
}

const DepositBitcoinModal: React.FC<DepositBitcoinModalProps> = ({
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
      const btcAmountInSatoshis = numValue * 100000000;
      if (btcAmountInSatoshis > user.btcBalance) {
        alert('Insufficient Bitcoin balance for withdrawal.');
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
      const endpoint = isWithdrawMode ? 'withdraw-bitcoin' : 'deposit-bitcoin';
      const response = await fetch(`${getApiUrl()}/api/admin/users/${user.id}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('bittrade_token')}`
        },
        body: JSON.stringify({
          amount: parseFloat(inputValue) * 100000000 // Convert BTC to satoshis
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to ${isWithdrawMode ? 'withdraw' : 'deposit'} Bitcoin`);
      }

      const result = await response.json();
      console.log(`✅ Bitcoin ${isWithdrawMode ? 'withdrawal' : 'deposit'} successful:`, result);
      
      // Call completion callback
      if (onComplete) {
        onComplete(user, inputValue);
      }
      
      // Close entire modal flow
      onClose();
    } catch (error) {
      console.error(`❌ Bitcoin ${isWithdrawMode ? 'withdrawal' : 'deposit'} failed:`, error);
      
      // Show error message to user
      const errorMessage = error instanceof Error ? error.message : `Bitcoin ${isWithdrawMode ? 'withdrawal' : 'deposit'} failed`;
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
    
    const btcAmount = parseFloat(inputValue);
    
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
        value: <AnimateBTC value={btcAmount * 100000000} className="text-sm font-normal text-white" />,
        highlight: true
      },
      {
        label: 'Current Balance',
        value: formatBitcoinForDisplay(user.btcBalance),
        highlight: false
      },
      {
        label: 'New Balance',
        value: formatBitcoinForDisplay(user.btcBalance + (isWithdrawMode ? -(btcAmount * 100000000) : (btcAmount * 100000000))),
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
        title={`${isWithdrawMode ? 'Withdraw' : 'Deposit'} Bitcoin`}
        type="btc"
        confirmText="Next"
        onConfirm={handleInputConfirm}
        sectionTitle={`${isWithdrawMode ? 'Withdraw' : 'Deposit'} for ${user.name}`}
        sectionDetail={`${isWithdrawMode ? 'Remove Bitcoin from' : 'Add Bitcoin to'} ${user.name}'s wallet`}
        onSectionClick={handleModeToggle}
        initialValue={inputValue}
        maxValue={isWithdrawMode ? user.btcBalance / 100000000 : undefined}
        maxButtonText={isWithdrawMode ? `Max ${formatBitcoinForDisplay(user.btcBalance)}` : undefined}
      />

      {/* Confirmation Modal - Opens on top of SingleInputModal */}
      <ConfirmationModal
        isOpen={isOpen && showConfirmation}
        onClose={handleConfirmationClose}
        title={`Confirm Bitcoin ${isWithdrawMode ? 'Withdrawal' : 'Deposit'}`}
        amount={inputValue ? (
          <AnimateBTC value={parseFloat(inputValue) * 100000000} className="justify-center text-white text-5xl font-semibold" />
        ) : undefined}
        amountType="btc"
        details={getConfirmationDetails()}
        confirmText={`${isWithdrawMode ? 'Withdraw' : 'Deposit'} Bitcoin`}
        onConfirm={handleConfirmationConfirm}
        isLoading={isProcessing}
        mode="confirm"
      />
    </>
  );
};

export default DepositBitcoinModal;
