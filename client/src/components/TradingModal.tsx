import React, { useState } from 'react';
import SingleInputModal from './SingleInputModal';
import ConfirmationModal from './ConfirmationModal';
import OptionsModal from './OptionsModal';
import { formatBitcoinForDisplay, formatRupeesForDisplay } from '../utils/formatters';
import { executeTrade, createLimitOrder } from '../utils/tradingApi';
import { AnimateINR, AnimateBTC } from './AnimateNumberFlow';
import DCAModal from './DCAModal';

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
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showOrderTypeModal, setShowOrderTypeModal] = useState(false);
  const [orderType, setOrderType] = useState<'market' | 'limit' | 'recurring'>('market');
  const [showDCAModal, setShowDCAModal] = useState(false);
  const [showTargetPriceModal, setShowTargetPriceModal] = useState(false);
  const [targetPrice, setTargetPrice] = useState('');
  
  // Track the current input value in real-time
  const [currentInputValue, setCurrentInputValue] = useState('');

  // Handle settings icon click
  const handleSettingsClick = () => {
    console.log('Settings icon clicked');
    setShowOrderTypeModal(true);
  };
  
  // Handle order type modal close
  const handleOrderTypeModalClose = () => {
    setShowOrderTypeModal(false);
  };
  
  // Handle target price modal close
  const handleTargetPriceModalClose = () => {
    setShowTargetPriceModal(false);
  };
  
  // Handle target price confirmation
  const handleTargetPriceConfirm = (price: string) => {
    setTargetPrice(price);
    setShowTargetPriceModal(false);
  };
  
  // Handle order type selection
  const handleOrderTypeSelect = (selectedOrderType: 'market' | 'limit' | 'recurring') => {
    console.log('Order type selected:', selectedOrderType);
    setOrderType(selectedOrderType);
    setShowOrderTypeModal(false);
    
    // If limit order is selected, show target price modal
    if (selectedOrderType === 'limit') {
      setShowTargetPriceModal(true);
    }
    // If recurring order is selected, just return to SingleInputModal
    // The DCA flow will be triggered when user clicks Next
  };

  // Reset state when modal opens/closes
  React.useEffect(() => {
    if (isOpen) {
      setInputValue('');
      setIsProcessing(false);
      setShowConfirmation(false);
      setOrderType('market');
      setShowDCAModal(false);
      setShowTargetPriceModal(false);
      setTargetPrice('');
    }
  }, [isOpen]);

  // Calculate conversion values
  const calculateConversion = (amount: string) => {
    const numAmount = parseFloat(amount) || 0;
    
    // Use target price for limit orders, otherwise use current market rate
    const effectiveRate = orderType === 'limit' && targetPrice 
      ? parseFloat(targetPrice)
      : type === 'buy' ? (buyRate || 0) : (sellRate || 0);
    
    if (type === 'buy') {
      // Buy: User inputs INR, gets BTC
      const btcAmount = effectiveRate > 0 ? numAmount / effectiveRate : 0;
      return {
        inrAmount: numAmount,
        btcAmount: btcAmount,
        formattedBtc: formatBitcoinForDisplay(btcAmount * 100000000),
        formattedInr: formatRupeesForDisplay(numAmount),
      };
    } else {
      // Sell: User inputs BTC, gets INR
      const inrAmount = effectiveRate > 0 ? numAmount * effectiveRate : 0;
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
    
    // If recurring order type is selected, show DCA modal instead of confirmation
    if (orderType === 'recurring') {
      setShowDCAModal(true);
    } else {
      setShowConfirmation(true);
    }
  };

  // Handle input modal close
  const handleInputClose = () => {
    onClose();
  };

  // Handle confirmation modal confirm
  const handleConfirmationConfirm = async () => {
    setIsProcessing(true);
    
    try {
      let tradeResult;
      
      if (orderType === 'limit' && targetPrice) {
        // Handle limit order
        const conversion = calculateConversion(inputValue);
        const orderData = {
          type: type === 'buy' ? 'LIMIT_BUY' as const : 'LIMIT_SELL' as const,
          btc_amount: Math.round(conversion.btcAmount * 100000000), // Convert to satoshis
          inr_amount: Math.round(conversion.inrAmount),
          execution_price: parseFloat(targetPrice)
        };
        
        console.log('🔄 Creating limit order:', orderData);
        tradeResult = await createLimitOrder(orderData);
      } else if (orderType === 'market') {
        // Handle market order
        const tradeRequest = {
          action: type,
          type: orderType as 'market',
          amount: inputValue,
          currency: (type === 'buy' ? 'inr' : 'btc') as 'inr' | 'btc'
        };
        
        console.log('🔄 Executing market trade:', tradeRequest);
        tradeResult = await executeTrade(tradeRequest);
      } else {
        // Recurring orders not implemented yet
        throw new Error('Recurring orders are not implemented yet');
      }
      
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
    // Hide confirmation modal, SingleInputModal stays open
    setShowConfirmation(false);
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
    const rate = orderType === 'limit' && targetPrice ? parseFloat(targetPrice) : (type === 'buy' ? (buyRate || 0) : (sellRate || 0));
    
    const details = [
      {
        label: 'Order Type',
        value: orderType === 'market' ? 'Market Order' : orderType === 'limit' ? 'Limit Order' : 'Recurring Order',
        highlight: false
      },
      {
        label: 'Amount',
        value: <AnimateINR value={conversion.inrAmount} className="text-sm font-normal text-white" />,
        highlight: true
      }
    ];
    
    // Add target price for limit orders
    if (orderType === 'limit' && targetPrice) {
      details.push({
        label: 'Target Price',
        value: <AnimateINR value={parseFloat(targetPrice)} className="text-sm font-normal text-white" />,
        highlight: true
      });
    } else {
      if (rate > 0) {
        details.push({
          label: 'Rate',
          value: <AnimateINR value={rate} className="text-sm font-normal text-white" />,
          highlight: false
        });
      } else {
        details.push({
          label: 'Rate',
          value: 'Rate unavailable',
          highlight: false
        });
      }
    }
    
    details.push(
      {
        label: 'You will ' + (type === 'buy' ? 'receive' : 'pay'),
        value: <AnimateBTC value={conversion.btcAmount * 100000000} className="text-sm font-normal text-white" />,
        highlight: true
      },
      {
        label: 'Fee',
        value: <AnimateINR value={0} className="text-sm font-normal text-white" />,
        highlight: false
      }
    );
    
    return details;
  };

  // Get button texts
  const getConfirmationButtonText = () => {
    return 'Confirm';
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
            className="w-full btn-strike-primary"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Input Modal - Always open when main modal is open */}
      <SingleInputModal
        isOpen={isOpen}
        onClose={handleInputClose}
        title={getInputTitle()}
        type={type === 'buy' ? 'inr' : 'btc'}
        confirmText="Next"
        onConfirm={handleInputConfirm}
        onValueChange={setCurrentInputValue} // Real-time value updates
        sectionTitle={orderType === 'limit' && targetPrice ? 'Target Price' : `${type === 'buy' ? 'Buy' : 'Sell'} Rate`}
        sectionAmount={orderType === 'limit' && targetPrice ? (
          <AnimateINR value={parseFloat(targetPrice)} className="text-sm font-medium text-gray-300" />
        ) : currentRate > 0 ? (
          <AnimateINR value={currentRate} className="text-sm font-medium text-gray-300" />
        ) : (
          'Rate unavailable'
        )}
        sectionDetail={orderType === 'limit' && targetPrice ? `Limit ${type} order at ₹${parseFloat(targetPrice).toLocaleString('en-IN')}` : undefined}
        maxValue={getMaxValue()}
        maxButtonText={getMaxButtonText()}
        initialValue={inputValue}
        showSettingsIcon={true}
        onSettingsClick={handleSettingsClick}
      />

      {/* Confirmation Modal - Opens on top of SingleInputModal */}
      <ConfirmationModal
        isOpen={isOpen && showConfirmation}
        onClose={handleConfirmationClose}
        title={getConfirmationTitle()}
        amount={inputValue ? (
          type === 'buy' ? (
            <AnimateINR value={parseFloat(inputValue)} className="justify-center text-white text-5xl font-normal" />
          ) : (
            <AnimateBTC value={parseFloat(inputValue) * 100000000} className="justify-center text-white text-5xl font-semibold" />
          )
        ) : undefined}
        amountType={type === 'buy' ? 'inr' : 'btc'}
        subAmount={inputValue ? (
          type === 'buy' ? (
            <AnimateBTC value={calculateConversion(inputValue).btcAmount * 100000000} className="justify-center text-white text-sm font-normal" />
          ) : (
            <AnimateINR value={calculateConversion(inputValue).inrAmount} className="justify-center text-white text-sm font-normal" />
          )
        ) : undefined}
        subAmountType={type === 'buy' ? 'btc' : 'inr'}
        details={getConfirmationDetails()}
        confirmText={getConfirmationButtonText()}
        onConfirm={handleConfirmationConfirm}
        isLoading={isProcessing}
        mode="confirm"
      />
      
      {/* Order Type Options Modal - Opens on top of SingleInputModal */}
      <OptionsModal
        isOpen={isOpen && showOrderTypeModal}
        onClose={handleOrderTypeModalClose}
        title="Order Type"
        type="custom"
      >
        <div className="space-y-3">
          {/* Market Order Option */}
          <div 
            className="bg-gray-900 hover:bg-gray-800 border border-gray-700 rounded-lg p-4 cursor-pointer transition-colors"
            onClick={() => handleOrderTypeSelect('market')}
            data-clickable="true"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white text-sm font-medium">Market Order</h3>
                <p className="text-gray-400 text-xs mt-1">Execute immediately at current market price</p>
              </div>
              {/* Show 'Current' if market order is selected OR if no target price is set */}
              {(orderType === 'market' || (orderType === 'limit' && !targetPrice)) && (
                <div className="text-brand text-xs">Current</div>
              )}
            </div>
          </div>
          
          {/* Limit Order Option */}
          <div 
            className="bg-gray-900 hover:bg-gray-800 border border-gray-700 rounded-lg p-4 cursor-pointer transition-colors"
            onClick={() => handleOrderTypeSelect('limit')}
            data-clickable="true"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white text-sm font-medium">Limit Order</h3>
                <p className="text-gray-400 text-xs mt-1">Set a specific price to {type} at</p>
              </div>
              {/* Show 'Current' if limit order is selected AND target price is set */}
              {(orderType === 'limit' && targetPrice) && (
                <div className="text-brand text-xs">Current</div>
              )}
            </div>
          </div>
          
          {/* Recurring Order (DCA) Option */}
          <div 
            className="bg-gray-900 hover:bg-gray-800 border border-gray-700 rounded-lg p-4 cursor-pointer transition-colors"
            onClick={() => handleOrderTypeSelect('recurring')}
            data-clickable="true"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white text-sm font-medium">Recurring Order (DCA)</h3>
                <p className="text-gray-400 text-xs mt-1">Set up automatic recurring {type === 'buy' ? 'purchases' : 'sales'}</p>
              </div>
              {/* Show 'Current' if recurring order is selected */}
              {orderType === 'recurring' && (
                <div className="text-brand text-xs">Current</div>
              )}
            </div>
          </div>
        </div>
      </OptionsModal>
      
{/* DCA Modal for recurring orders */}
      <DCAModal
        isOpen={isOpen && showDCAModal}
        onClose={() => setShowDCAModal(false)}
        balanceData={balanceData}
        currentBitcoinPrice={buyRate || 0}
        initialAmount={currentInputValue || inputValue}
        initialPlanType={type === 'buy' ? 'DCA_BUY' : 'DCA_SELL'}
        onComplete={(plan) => {
          console.log('DCA Plan completed:', plan);
          setShowDCAModal(false);
          onClose(); // Close the entire trading modal when DCA plan is completed
        }}
      />

      {/* Target Price Modal - Opens when limit order is selected */}
      <SingleInputModal
        isOpen={isOpen && showTargetPriceModal}
        onClose={handleTargetPriceModalClose}
        title={`Set Target Price`}
        type="inr"
        confirmText="Set Price"
        onConfirm={handleTargetPriceConfirm}
        sectionTitle={`Current ${type === 'buy' ? 'Buy' : 'Sell'} Rate`}
        sectionAmount={currentRate > 0 ? (
          <AnimateINR value={currentRate} className="text-sm font-medium text-gray-300" />
        ) : (
          'Rate unavailable'
        )}
        sectionDetail={`Enter the price at which you want to ${type} Bitcoin. Your order will execute when the market reaches this price.`}
        initialValue={targetPrice}
      />
    </>
  );
};

export default TradingModal;
