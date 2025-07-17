import React, { useState } from 'react';
import SingleInputModal from './SingleInputModal';
import ConfirmationModal from './ConfirmationModal';

interface TradingModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'buy' | 'sell';
  bitcoinPrice: number;
  onComplete?: (type: 'buy' | 'sell', amount: string) => void;
}

const TradingModal: React.FC<TradingModalProps> = ({
  isOpen,
  onClose,
  type,
  bitcoinPrice,
  onComplete,
}) => {
  const [currentStep, setCurrentStep] = useState<'input' | 'confirm'>('input');
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Reset state when modal opens/closes
  React.useEffect(() => {
    if (isOpen) {
      setCurrentStep('input');
      setInputValue('');
      setIsProcessing(false);
    }
  }, [isOpen]);

  // Calculate conversion values
  const calculateConversion = (amount: string) => {
    const numAmount = parseFloat(amount) || 0;
    const btcAmount = numAmount / bitcoinPrice;
    return {
      inrAmount: numAmount,
      btcAmount: btcAmount,
      formattedBtc: btcAmount.toFixed(8),
      formattedInr: numAmount.toLocaleString('en-IN'),
    };
  };

  // Handle input modal confirmation
  const handleInputConfirm = (value: string) => {
    setInputValue(value);
    setCurrentStep('confirm');
  };

  // Handle input modal close
  const handleInputClose = () => {
    onClose();
  };

  // Handle confirmation modal confirm
  const handleConfirmationConfirm = async () => {
    setIsProcessing(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Call completion callback
      if (onComplete) {
        onComplete(type, inputValue);
      }
      
      // Close entire modal flow
      onClose();
    } catch (error) {
      console.error('Transaction failed:', error);
      // In a real app, you'd show an error message
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle confirmation modal cancel/close
  const handleConfirmationClose = () => {
    // Go back to input modal
    setCurrentStep('input');
  };

  // Get modal titles
  const getInputTitle = () => {
    return type === 'buy' ? 'Buy Bitcoin' : 'Sell Bitcoin';
  };

  const getConfirmationTitle = () => {
    return type === 'buy' ? 'Confirm Purchase' : 'Confirm Sale';
  };

  // Get confirmation details
  const getConfirmationDetails = () => {
    if (!inputValue) return [];
    
    const conversion = calculateConversion(inputValue);
    const rate = type === 'buy' ? buyRate : sellRate;
    
    return [
      {
        label: 'Amount',
        value: `₹${conversion.formattedInr}`,
        highlight: true
      },
      {
        label: 'Rate',
        value: `₹${rate.toLocaleString('en-IN')}`,
        highlight: false
      },
      {
        label: 'You will ' + (type === 'buy' ? 'receive' : 'pay'),
        value: `₿${conversion.formattedBtc}`,
        highlight: true
      },
      {
        label: 'Fee',
        value: '₹0.00',
        highlight: false
      }
    ];
  };

  // Get button texts
  const getConfirmationButtonText = () => {
    return type === 'buy' ? 'Buy Now' : 'Sell Now';
  };

  // Calculate rates for display
  const buyRate = bitcoinPrice * 91; // Buy rate: price * 91
  const sellRate = bitcoinPrice * 88; // Sell rate: price * 88
  const currentRate = type === 'buy' ? buyRate : sellRate;

  return (
    <>
      {/* Input Modal */}
      <SingleInputModal
        isOpen={isOpen && currentStep === 'input'}
        onClose={handleInputClose}
        title={getInputTitle()}
        type="inr"
        confirmText={getConfirmationButtonText()}
        onConfirm={handleInputConfirm}
        sectionTitle={`${type === 'buy' ? 'Buy' : 'Sell'} Rate`}
        sectionAmount={`₹${currentRate.toLocaleString('en-IN')}`}
        sectionDetail={`1 BTC = ₹${currentRate.toLocaleString('en-IN')}`}
      />

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={isOpen && currentStep === 'confirm'}
        onClose={handleConfirmationClose}
        title={getConfirmationTitle()}
        amount={inputValue}
        amountType="inr"
        subAmount={inputValue ? calculateConversion(inputValue).formattedBtc : ''}
        subAmountType="btc"
        details={getConfirmationDetails()}
        confirmText={getConfirmationButtonText()}
        onConfirm={handleConfirmationConfirm}
        isLoading={isProcessing}
        mode="confirm"
      />
    </>
  );
};

export default TradingModal;
