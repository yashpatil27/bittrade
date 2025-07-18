import React, { useState } from 'react';
import SingleInputModal from './SingleInputModal';
import ConfirmationModal from './ConfirmationModal';
import { formatBitcoinForDisplay, formatRupeesForDisplay } from '../utils/formatters';
import { executeTrade } from '../utils/tradingApi';
import { AnimateINR, AnimateBTC } from './AnimateNumberFlow';

interface BalanceData {
  available_inr: number;
  available_btc: number;
  reserved_inr: number;
  reserved_btc: number;
  collateral_btc: number;
  borrowed_inr: number;
  interest_accrued: number;
}

interface TradingModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'buy' | 'sell';
  buyRate?: number;
  sellRate?: number;
  balanceData?: BalanceData | null;
  onComplete?: (type: 'buy' | 'sell', amount: string) => void;
}

const TradingModal: React.FC<TradingModalProps> = ({
  isOpen,
  onClose,
  type,
  buyRate,
  sellRate,
  balanceData,
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
    
    if (type === 'buy') {
      // Buy: User inputs INR, gets BTC
      const btcAmount = currentRate > 0 ? numAmount / currentRate : 0;
      return {
        inrAmount: numAmount,
        btcAmount: btcAmount,
        formattedBtc: formatBitcoinForDisplay(btcAmount * 100000000),
        formattedInr: formatRupeesForDisplay(numAmount),
      };
    } else {
      // Sell: User inputs BTC, gets INR
      const inrAmount = currentRate > 0 ? numAmount * currentRate : 0;
      return {
        inrAmount: inrAmount,
        btcAmount: numAmount,
        formattedBtc: formatBitcoinForDisplay(numAmount * 100000000),
        formattedInr: formatRupeesForDisplay(inrAmount),
      };
    }
  };

  // Handle input modal confirmation with validation
  const handleInputConfirm = (value: string) => {
    const numValue = parseFloat(value);
    const maxValue = getMaxValue();
    
    if (numValue < 0 || (maxValue !== undefined && numValue > maxValue)) {
      alert('Please enter a valid amount that is within your available balance and not negative.');
      return;
    }

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
      // Prepare trade request
      const tradeRequest = {
        action: type,
        type: 'market' as const,
        amount: inputValue,
        currency: (type === 'buy' ? 'inr' : 'btc') as 'inr' | 'btc'
      };
      
      console.log('🔄 Executing trade:', tradeRequest);
      
      // Execute trade via API
      const tradeResult = await executeTrade(tradeRequest);
      
      console.log('✅ Trade executed successfully:', tradeResult);
      
      // Call completion callback
      if (onComplete) {
        onComplete(type, inputValue);
      }
      
      // Close entire modal flow
      onClose();
    } catch (error) {
      console.error('❌ Trade execution failed:', error);
      
      // Show error message to user
      const errorMessage = error instanceof Error ? error.message : 'Trade execution failed';
      alert(`Transaction failed: ${errorMessage}`);
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
        value: <AnimateINR value={conversion.inrAmount} className="text-sm font-medium text-white" />,
        highlight: true
      },
      {
        label: 'Rate',
        value: rate > 0 ? <AnimateINR value={rate} className="text-sm font-medium text-zinc-300" /> : 'Rate unavailable',
        highlight: false
      },
      {
        label: 'You will ' + (type === 'buy' ? 'receive' : 'pay'),
        value: <AnimateBTC value={conversion.btcAmount * 100000000} className="text-sm font-medium text-white" />,
        highlight: true
      },
      {
        label: 'Fee',
        value: <AnimateINR value={0} className="text-sm font-medium text-zinc-300" />,
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
  
  // Calculate max values based on balance and type
  const getMaxValue = () => {
    if (!balanceData) return undefined;
    
    if (type === 'buy') {
      // For buy: max is available INR
      return balanceData.available_inr;
    } else {
      // For sell: max is available BTC in BTC units
      return balanceData.available_btc / 100000000; // Convert satoshis to BTC
    }
  };
  
  // Get max button text with proper formatting
  const getMaxButtonText = () => {
    console.log('🔍 getMaxButtonText called:', { balanceData, type });
    if (!balanceData) {
      console.log('⚠️ No balance data available');
      return 'Max';
    }
    
    if (type === 'buy') {
      // For buy: show available INR
      const formatted = formatRupeesForDisplay(balanceData.available_inr);
      console.log('💰 Buy max button:', formatted);
      return `Max ${formatted}`;
    } else {
      // For sell: show available BTC
      const formatted = formatBitcoinForDisplay(balanceData.available_btc);
      console.log('₿ Sell max button:', formatted);
      return `Max ${formatted}`;
    }
  };
  
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
        type={type === 'buy' ? 'inr' : 'btc'}
        confirmText={getConfirmationButtonText()}
        onConfirm={handleInputConfirm}
        sectionTitle={`${type === 'buy' ? 'Buy' : 'Sell'} Rate`}
        sectionAmount={currentRate > 0 ? (
          <AnimateINR value={currentRate} className="text-sm font-medium text-gray-300" />
        ) : (
          'Rate unavailable'
        )}
        maxValue={getMaxValue()}
        maxButtonText={getMaxButtonText()}
      />

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={isOpen && currentStep === 'confirm'}
        onClose={handleConfirmationClose}
        title={getConfirmationTitle()}
        amount={inputValue ? (
          type === 'buy' ? (
            <AnimateINR value={parseFloat(inputValue)} className="justify-center text-white text-5xl font-light" />
          ) : (
            <AnimateBTC value={parseFloat(inputValue) * 100000000} className="justify-center text-white text-5xl font-light" />
          )
        ) : undefined}
        amountType={type === 'buy' ? 'inr' : 'btc'}
        subAmount={inputValue ? (
          type === 'buy' ? (
            <AnimateBTC value={calculateConversion(inputValue).btcAmount * 100000000} className="justify-center text-zinc-400 text-lg font-light" />
          ) : (
            <AnimateINR value={calculateConversion(inputValue).inrAmount} className="justify-center text-zinc-400 text-lg font-light" />
          )
        ) : undefined}
        subAmountType={type === 'buy' ? 'btc' : 'inr'}
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
