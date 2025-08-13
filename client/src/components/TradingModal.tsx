import React, { useState } from 'react';
import SingleInputModal from './SingleInputModal';
import ConfirmationModal from './ConfirmationModal';
import OptionsModal from './OptionsModal';
import { formatBitcoinForDisplay, formatRupeesForDisplay } from '../utils/formatters';
import { executeTrade, createLimitOrder } from '../utils/tradingApi';
import { AnimateINR, AnimateBTC } from './AnimateNumberFlow';
import logger from '../utils/logger';

interface BalanceData {
  available_inr: number;
  available_btc: number;
  reserved_inr: number;
  reserved_btc: number;
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
  const [inputCurrency, setInputCurrency] = useState<'inr' | 'btc'>(type === 'buy' ? 'inr' : 'btc'); // Track actual selected currency
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showOrderTypeModal, setShowOrderTypeModal] = useState(false);
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [showTargetPriceModal, setShowTargetPriceModal] = useState(false);
  const [targetPrice, setTargetPrice] = useState('');

  // Handle settings icon click
  const handleSettingsClick = () => {
    logger.component('TradingModal', 'settings_clicked');
    setShowOrderTypeModal(true);
  };
  
  // Handle orbit icon click
  const handleOrbitClick = () => {
    logger.component('TradingModal', 'orbit_clicked');
    // Add orbit functionality here
  };
  
  // Handle currency change from SingleInputModal
  const handleCurrencyChange = (currency: 'inr' | 'btc') => {
    logger.component('TradingModal', 'currency_changed', currency);
    setInputCurrency(currency);
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
  const handleOrderTypeSelect = (selectedOrderType: 'market' | 'limit') => {
    logger.component('TradingModal', 'order_type_selected', selectedOrderType);
    setOrderType(selectedOrderType);
    setShowOrderTypeModal(false);
    
    // If limit order is selected, show target price modal
    if (selectedOrderType === 'limit') {
      setShowTargetPriceModal(true);
    }
  };

  // Reset state when modal opens/closes
  React.useEffect(() => {
    if (isOpen) {
      setInputValue('');
      setInputCurrency(type === 'buy' ? 'inr' : 'btc'); // Reset to default currency
      setIsProcessing(false);
      setShowConfirmation(false);
      setOrderType('market');
      setShowTargetPriceModal(false);
      setTargetPrice('');
    }
  }, [isOpen, type]);

  // Calculate conversion values based on actual input currency
  const calculateConversion = (amount: string) => {
    const numAmount = parseFloat(amount) || 0;
    
    // Use target price for limit orders, otherwise use current market rate
    const effectiveRate = orderType === 'limit' && targetPrice 
      ? parseFloat(targetPrice)
      : type === 'buy' ? (buyRate || 0) : (sellRate || 0);
    
    // Calculate based on actual input currency, not trade type
    if (inputCurrency === 'inr') {
      // User input INR, calculate BTC equivalent
      const btcAmount = effectiveRate > 0 ? numAmount / effectiveRate : 0;
      return {
        inrAmount: numAmount,
        btcAmount: btcAmount,
        formattedBtc: formatBitcoinForDisplay(btcAmount * 100000000),
        formattedInr: formatRupeesForDisplay(numAmount),
      };
    } else {
      // User input BTC, calculate INR equivalent
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
    
    setShowConfirmation(true);
  };

  // Handle input modal close
  const handleInputClose = () => {
    onClose();
  };

  // Handle confirmation modal confirm
  const handleConfirmationConfirm = async () => {
    setIsProcessing(true);
    
    try {
      if (orderType === 'limit' && targetPrice) {
        // Handle limit order
        const conversion = calculateConversion(inputValue);
        const orderData = {
          type: type === 'buy' ? 'LIMIT_BUY' as const : 'LIMIT_SELL' as const,
          btc_amount: Math.round(conversion.btcAmount * 100000000), // Convert to satoshis
          inr_amount: Math.round(conversion.inrAmount),
          execution_price: parseFloat(targetPrice)
        };
        
        logger.api('POST', '/api/orders', undefined, undefined);
        await createLimitOrder(orderData);
      } else if (orderType === 'market') {
        // Handle market order
        const tradeRequest = {
          action: type,
          type: orderType as 'market',
          amount: inputValue,
          currency: inputCurrency // Use the actual selected currency
        };
        
        logger.api('POST', '/api/trade', undefined, undefined);
        await executeTrade(tradeRequest);
      }
      
      logger.success(`${type} order executed successfully`, { component: 'TradingModal' });
      
      // Call completion callback
      if (onComplete) {
        onComplete(type, inputValue);
      }
      
      // Close entire modal flow
      onClose();
    } catch (error) {
      logger.error('Trade execution failed', error, { component: 'TradingModal' });
      
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
        value: orderType === 'market' ? 'Market Order' : 'Limit Order',
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
    
    details.push({
      label: 'You will ' + (type === 'buy' ? 'receive' : 'pay'),
      value: <AnimateBTC value={conversion.btcAmount * 100000000} className="text-sm font-normal text-white" />,
      highlight: true
    });
    
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
  
  // Calculate max values based on balance and currency type
  const getMaxValue = () => {
    if (!balanceData) return undefined;
    
    // Use target price for limit orders, otherwise use current market rate
    const effectiveRate = orderType === 'limit' && targetPrice 
      ? parseFloat(targetPrice)
      : type === 'buy' ? (buyRate || 0) : (sellRate || 0);
    
    if (type === 'buy') {
      if (inputCurrency === 'inr') {
        return balanceData.available_inr;
      } else if (inputCurrency === 'btc' && effectiveRate > 0) {
        // Use Math.floor to prevent rounding errors for buy with BTC input
        const maxBtcRaw = balanceData.available_inr / effectiveRate;
        const maxBtcSatoshis = Math.floor(maxBtcRaw * 100000000);
        return maxBtcSatoshis / 100000000;
      }
    } else {
      if (inputCurrency === 'btc') {
        return balanceData.available_btc / 100000000; // Convert satoshis to BTC
      } else if (inputCurrency === 'inr' && effectiveRate > 0) {
        // Use Math.floor to prevent rounding errors for sell with INR input
        const maxInrRaw = (balanceData.available_btc / 100000000) * effectiveRate;
        return Math.floor(maxInrRaw);
      }
    }
  };
  
  // Get max button text with proper formatting based on currency type
  const getMaxButtonText = () => {
    logger.debug('getMaxButtonText called', { component: 'TradingModal' });
    if (!balanceData) {
      logger.debug('No balance data available', { component: 'TradingModal' });
      return 'Max';
    }
    
    // Use target price for limit orders, otherwise use current market rate
    const effectiveRate = orderType === 'limit' && targetPrice 
      ? parseFloat(targetPrice)
      : type === 'buy' ? (buyRate || 0) : (sellRate || 0);
    
    if (type === 'buy') {
      if (inputCurrency === 'inr') {
        // Show available INR
        const formatted = formatRupeesForDisplay(balanceData.available_inr);
        return `Max ${formatted}`;
      } else if (inputCurrency === 'btc' && effectiveRate > 0) {
        // Show max BTC that can be bought with available INR using effective rate
        const maxBtc = balanceData.available_inr / effectiveRate;
        const maxBtcSatoshis = Math.floor(maxBtc * 100000000);
        const formatted = formatBitcoinForDisplay(maxBtcSatoshis);
        return `Max ${formatted}`;
      }
    } else {
      if (inputCurrency === 'btc') {
        // Show available BTC
        const formatted = formatBitcoinForDisplay(balanceData.available_btc);
        return `Max ${formatted}`;
      } else if (inputCurrency === 'inr' && effectiveRate > 0) {
        // Show max INR that can be obtained by selling available BTC using effective rate
        const maxInr = (balanceData.available_btc / 100000000) * effectiveRate;
        const formatted = formatRupeesForDisplay(maxInr);
        return `Max ${formatted}`;
      }
    }
    
    return 'Max';
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
        type={inputCurrency}
        confirmText="Next"
        onConfirm={handleInputConfirm}
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
        showOrbitIcon={true}
        onOrbitClick={handleOrbitClick}
        onCurrencyChange={handleCurrencyChange}
        showXIcon={true}
      />

      {/* Confirmation Modal - Opens on top of SingleInputModal */}
      <ConfirmationModal
        isOpen={isOpen && showConfirmation}
        onClose={handleConfirmationClose}
        title={getConfirmationTitle()}
        amount={inputValue ? (
          inputCurrency === 'inr' ? (
            formatRupeesForDisplay(parseFloat(inputValue))
          ) : (
            formatBitcoinForDisplay(parseFloat(inputValue) * 100000000)
          )
        ) : undefined}
        amountType={inputCurrency}
        subAmount={inputValue ? (
          inputCurrency === 'inr' ? (
            <AnimateBTC value={calculateConversion(inputValue).btcAmount * 100000000} className="justify-center text-white text-sm font-normal" />
          ) : (
            <AnimateINR value={calculateConversion(inputValue).inrAmount} className="justify-center text-white text-sm font-normal" />
          )
        ) : undefined}
        subAmountType={inputCurrency === 'inr' ? 'btc' : 'inr'}
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
          
        </div>
      </OptionsModal>
      

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
