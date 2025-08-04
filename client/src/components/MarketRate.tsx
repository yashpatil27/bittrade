import React, { useEffect } from 'react';
// Removed unused imports: TrendingUp, TrendingDown
import { usePrice } from '../context/PriceContext';
import { AnimateINR } from './AnimateNumberFlow';

interface MarketRateProps {
  className?: string;
  onBuyClick?: () => void;
  onSellClick?: () => void;
  onRatesUpdate?: (buyRate: number, sellRate: number) => void;
}


const MarketRate: React.FC<MarketRateProps> = ({ className = "", onBuyClick, onSellClick, onRatesUpdate }) => {
  // Use centralized price context
  const { buyRateInr, sellRateInr, pricesLoading, hasValidPrices } = usePrice();

  // Use rates from PriceContext
  const buyRate = buyRateInr || 0;
  const sellRate = sellRateInr || 0;

  // Notify parent component of rate updates
  useEffect(() => {
    if (onRatesUpdate) {
      onRatesUpdate(buyRate, sellRate);
    }
  }, [buyRate, sellRate, onRatesUpdate]);



  // Show loading state when no data is available
  if (pricesLoading || !hasValidPrices) {
    return (
      <div className={`bg-gray-900 border border-gray-800 rounded-xl p-3 ${className}`}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-medium text-white">Market Rates</h3>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-yellow-400">Loading...</span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          {/* Buy Rate Loading */}
          <div className="text-center">
            <p className="text-xs text-gray-400 mb-1">Buy Rate</p>
            <div className="h-6 bg-gray-700 rounded animate-pulse mb-2"></div>
            <button 
              disabled
              className="w-full btn-strike-primary flex items-center justify-center space-x-1"
            >
              <span>Loading...</span>
            </button>
          </div>

          {/* Sell Rate Loading */}
          <div className="text-center">
            <p className="text-xs text-gray-400 mb-1">Sell Rate</p>
            <div className="h-6 bg-gray-700 rounded animate-pulse mb-2"></div>
            <button 
              disabled
              className="w-full btn-strike-primary flex items-center justify-center space-x-1"
            >
              <span>Loading...</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-900 border border-gray-800 rounded-xl p-3 ${className}`}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-medium text-white">Market Rates</h3>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        {/* Buy Rate */}
        <div className="text-center">
          <p className="text-xs text-gray-400 mb-1">Buy Rate</p>
          <p className="text-base font-semibold text-white mb-2">
            <AnimateINR 
              value={buyRate}
              className="justify-center text-base font-semibold text-white"
            />
          </p>
          <button 
            onClick={onBuyClick}
            className="w-full btn-strike-primary rounded-xl flex items-center justify-center space-x-1"
          >
            
            <span className="font-medium">Buy</span>
          </button>
        </div>

        {/* Sell Rate */}
        <div className="text-center">
          <p className="text-xs text-gray-400 mb-1">Sell Rate</p>
          <p className="text-base font-semibold text-white mb-2">
            <AnimateINR 
              value={sellRate}
              className="justify-center text-base font-semibold text-white"
            />
          </p>
          <button 
            onClick={onSellClick}
            className="w-full btn-strike-primary rounded-xl flex items-center justify-center space-x-1"
          >
            
            <span className="font-medium">Sell</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MarketRate;
