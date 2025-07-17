import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MarketRateProps {
  bitcoinPrice: number;
  className?: string;
  onBuyClick?: () => void;
  onSellClick?: () => void;
}

const MarketRate: React.FC<MarketRateProps> = ({ bitcoinPrice, className = "", onBuyClick, onSellClick }) => {
  const buyRate = bitcoinPrice * 91;
  const sellRate = bitcoinPrice * 88;

  const formatINR = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className={`bg-gray-900 border border-gray-800 rounded-xl p-3 ${className}`}>
      <div className="mb-3">
        <h3 className="text-base font-medium text-white">Market Rates</h3>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        {/* Buy Rate */}
        <div className="text-center">
          <p className="text-xs text-gray-400 mb-1">Buy Rate</p>
          <p className="text-base font-semibold text-white mb-2">
            {formatINR(buyRate)}
          </p>
          <button 
            onClick={onBuyClick}
            className="w-full border-2 border-transparent bg-brand text-black hover:bg-brand/80 hover:shadow-lg hover:shadow-brand/20 transition-all duration-200 rounded-lg py-1.5 px-3 text-xs font-light flex items-center justify-center space-x-1"
          >
            <TrendingUp className="w-3 h-3" />
            <span>Buy Bitcoin</span>
          </button>
        </div>

        {/* Sell Rate */}
        <div className="text-center">
          <p className="text-xs text-gray-400 mb-1">Sell Rate</p>
          <p className="text-base font-semibold text-white mb-2">
            {formatINR(sellRate)}
          </p>
          <button 
            onClick={onSellClick}
            className="w-full border-2 border-brand bg-transparent text-brand hover:bg-brand hover:text-black hover:shadow-lg hover:shadow-brand/20 transition-all duration-200 rounded-lg py-1.5 px-3 text-xs font-light flex items-center justify-center space-x-1"
          >
            <TrendingDown className="w-3 h-3" />
            <span>Sell Bitcoin</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MarketRate;
