import React, { useState } from 'react';
import SingleInputModal from './SingleInputModal';
import ConfirmationModal from './ConfirmationModal';
import AnimatedNumber from './AnimatedNumber';

interface TradingModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'buy' | 'sell';
  buyRate?: number;
  sellRate?: number;
  onComplete?: (type: 'buy' | 'sell', amount: string) => void;
}

const TradingModal: React.FC<TradingModalProps> = ({
  isOpen,
  onClose,
  type,
  buyRate,
  sellRate,
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
    const currentRate = type === 'buy' ? (buyRate || 0) : (sellRate || 0);
    const btcAmount = currentRate > 0 ? numAmount / currentRate : 0;
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
    const rate = type === 'buy' ? (buyRate || 0) : (sellRate || 0);
    
    return [
      {
        label: 'Amount',
        value: `₹${conversion.formattedInr}`,
        numericValue: conversion.inrAmount,
        highlight: true
      },
      {
        label: 'Rate',
        value: rate > 0 ? `₹${rate.toLocaleString('en-IN')}` : 'Rate unavailable',
        numericValue: rate > 0 ? rate : undefined,
        highlight: false
      },
      {
        label: 'You will ' + (type === 'buy' ? 'receive' : 'pay'),
        value: `₿${conversion.formattedBtc}`,
        numericValue: conversion.btcAmount,
        highlight: true
      },
      {
        label: 'Fee',
        value: '₹0.00',
        numericValue: 0,
        highlight: false
      }
    ];
  };

  // Get button texts
  const getConfirmationButtonText = () => {
    return type === 'buy' ? 'Buy Now' : 'Sell Now';
  };

  // Calculate rates for display - WebSocket data only
  const currentBuyRate = buyRate || 0; // Buy rate: WebSocket rate only
  const currentSellRate = sellRate || 0; // Sell rate: WebSocket rate only
  const currentRate = type === 'buy' ? currentBuyRate : currentSellRate;
  
  // Don't allow modal to open if rates are not available
  if (isOpen && currentRate === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-sm w-full">
          <h3 className="text-lg font-semibold text-white mb-4">Rates Unavailable</h3>
          <p className="text-gray-300 mb-4">
            Unable to {type} Bitcoin at the moment. Please wait for live rates to load.
          </p>
          <button
            onClick={onClose}
            className="w-full bg-brand text-black hover:bg-brand/80 transition-colors rounded-lg py-2 px-4 font-medium"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

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
        sectionAmount={currentRate > 0 ? `₹${currentRate.toLocaleString('en-IN')}` : 'Rate unavailable'}
        sectionAmountValue={currentRate > 0 ? currentRate : undefined}
      />

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={isOpen && currentStep === 'confirm'}
        onClose={handleConfirmationClose}
        title={getConfirmationTitle()}
        amount={inputValue}
        amountValue={inputValue ? parseFloat(inputValue) : undefined}
        amountType="inr"
        subAmount={inputValue ? calculateConversion(inputValue).formattedBtc : ''}
        subAmountValue={inputValue ? calculateConversion(inputValue).btcAmount : undefined}
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
