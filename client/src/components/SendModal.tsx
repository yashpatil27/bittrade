import React, { useState, useEffect } from 'react';
import SingleInputModal from './SingleInputModal';
import ConfirmationModal from './ConfirmationModal';
import OptionsModal from './OptionsModal';
import { Mail, AlertCircle } from 'lucide-react';
import { formatBitcoinForDisplay, formatRupeesForDisplay } from '../utils/formatters';
import { AnimateINR, AnimateBTC } from './AnimateNumberFlow';
import { useBalance } from '../context/BalanceContext';
import { getApiUrl } from '../utils/api';

interface SendModalProps {
  isOpen: boolean;
  onRequestClose: () => void;
}

const SendModal: React.FC<SendModalProps> = ({ isOpen, onRequestClose }) => {
  const { balanceData } = useBalance();
  const [inputValue, setInputValue] = useState('');
  const [inputCurrency, setInputCurrency] = useState<'inr' | 'btc'>('inr');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [validationError, setValidationError] = useState('');

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setInputValue('');
      setInputCurrency('inr');
      setRecipientEmail('');
      setIsProcessing(false);
      setShowEmailModal(false);
      setShowConfirmation(false);
      setValidationError('');
    }
  }, [isOpen]);

  // Handle currency change from orbit icon
  const handleCurrencyChange = (currency: 'inr' | 'btc') => {
    setInputCurrency(currency);
  };

  // Handle input modal confirmation with validation
  const handleInputConfirm = (value: string) => {
    const numValue = parseFloat(value);
    const maxValue = getMaxValue();
    
    if (numValue <= 0) {
      setValidationError('Please enter an amount greater than 0.');
      return;
    }
    
    if (maxValue !== undefined && numValue > maxValue) {
      setValidationError('Amount exceeds your available balance.');
      return;
    }

    setInputValue(value);
    setValidationError('');
    setShowEmailModal(true);
  };

  // Handle input modal close
  const handleInputClose = () => {
    onRequestClose();
  };

  // Handle email modal close
  const handleEmailModalClose = () => {
    setShowEmailModal(false);
  };

  // Handle email validation and confirmation
  const handleEmailConfirm = async () => {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      setValidationError('Please enter a valid email address.');
      return;
    }

    // TODO: Check if email exists in users table and is not current user's email
    // For now, just proceed to confirmation
    setValidationError('');
    setShowEmailModal(false);
    setShowConfirmation(true);
  };

  // Handle confirmation modal confirm
  const handleConfirmationConfirm = async () => {
    setIsProcessing(true);
    
    try {
      const response = await fetch(`${getApiUrl()}/api/send-transaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('bittrade_token')}`
        },
        body: JSON.stringify({
          recipientEmail: recipientEmail.toLowerCase().trim(),
          amount: parseFloat(inputValue),
          currency: inputCurrency
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData?.error || 'Failed to send transaction.');
      }

      const result = await response.json();
      
      console.log('✅ Transaction sent successfully:', result);
      onRequestClose();
    } catch (error) {
      console.error('❌ Send transaction failed:', error);
      setValidationError(error instanceof Error ? error.message : 'Transaction failed');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle confirmation modal cancel/close
  const handleConfirmationClose = () => {
    setShowConfirmation(false);
  };

  // Calculate max values based on balance and currency type
  const getMaxValue = () => {
    if (!balanceData) return undefined;
    
    if (inputCurrency === 'inr') {
      return balanceData.available_inr;
    } else {
      return balanceData.available_btc / 100000000; // Convert satoshis to BTC
    }
  };
  
  // Get max button text with proper formatting
  const getMaxButtonText = () => {
    if (!balanceData) return 'Max';
    
    if (inputCurrency === 'inr') {
      const formatted = formatRupeesForDisplay(balanceData.available_inr);
      return `Max ${formatted}`;
    } else {
      const formatted = formatBitcoinForDisplay(balanceData.available_btc);
      return `Max ${formatted}`;
    }
  };

  // Get confirmation details
  const getConfirmationDetails = () => {
    if (!inputValue) return [];
    
    const numAmount = parseFloat(inputValue);
    const details = [
      {
        label: 'Recipient',
        value: recipientEmail,
        highlight: false
      },
      {
        label: 'Amount',
        value: inputCurrency === 'inr' ? (
          <AnimateINR value={numAmount} className="text-sm font-normal text-white" />
        ) : (
          <AnimateBTC value={numAmount * 100000000} className="text-sm font-normal text-white" />
        ),
        highlight: true
      },
      {
        label: 'Currency',
        value: inputCurrency === 'inr' ? 'Indian Rupee (INR)' : 'Bitcoin (BTC)',
        highlight: false
      }
    ];
    
    return details;
  };

  return (
    <>
      {/* Input Modal - Always open when main modal is open */}
      <SingleInputModal
        isOpen={isOpen}
        onClose={handleInputClose}
        title="Send"
        type={inputCurrency}
        confirmText="Next"
        onConfirm={handleInputConfirm}
        maxValue={getMaxValue()}
        maxButtonText={getMaxButtonText()}
        initialValue={inputValue}
        showOrbitIcon={true}
        onCurrencyChange={handleCurrencyChange}
        showXIcon={true}
        disableKeyboardHandling={showEmailModal || showConfirmation}
      />

      {/* Email Entry Modal - Opens on top of SingleInputModal */}
      <OptionsModal
        isOpen={isOpen && showEmailModal}
        onClose={handleEmailModalClose}
        title="Recipient Email"
        type="custom"
      >
        <div className="space-y-4">
          {validationError && (
            <div className="p-3 bg-red-900/50 border border-red-700 rounded-lg flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span className="text-red-200 text-sm">{validationError}</span>
            </div>
          )}
          <div className="space-y-2">
            <label className="flex items-center space-x-3 text-white text-sm font-medium">
              <Mail className="w-4 h-4 text-brand" />
              <span>Enter recipient's email address</span>
            </label>
            <input
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-brand"
              placeholder="user@example.com"
              autoFocus
            />
          </div>
          <button
            onClick={handleEmailConfirm}
            className="w-full bg-white hover:bg-gray-100 text-black font-medium py-3 px-4 rounded-lg transition-colors"
          >
            Continue
          </button>
        </div>
      </OptionsModal>

      {/* Confirmation Modal - Opens on top of other modals */}
      <ConfirmationModal
        isOpen={isOpen && showConfirmation}
        onClose={handleConfirmationClose}
        title="Confirm Send"
        amount={inputValue ? (
          inputCurrency === 'inr' ? (
            formatRupeesForDisplay(parseFloat(inputValue))
          ) : (
            formatBitcoinForDisplay(parseFloat(inputValue) * 100000000)
          )
        ) : undefined}
        amountType={inputCurrency}
        details={getConfirmationDetails()}
        confirmText="Send"
        onConfirm={handleConfirmationConfirm}
        isLoading={isProcessing}
        mode="confirm"
      />
    </>
  );
};

export default SendModal;
