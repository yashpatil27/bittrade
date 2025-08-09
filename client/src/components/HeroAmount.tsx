import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useBalance } from '../context/BalanceContext';
import { usePrice } from '../context/PriceContext';
import { AnimateBTC, AnimateINR } from './AnimateNumberFlow';

interface HeroAmountProps {
  className?: string;
  onMaxClick?: () => void;
}

const HeroAmount: React.FC<HeroAmountProps> = ({ className = '', onMaxClick }) => {
  const { balanceData, isLoading } = useBalance();
  const { sellRateInr } = usePrice();
  const [showInr, setShowInr] = useState(false);

  // Calculate values
  const availableBtcSatoshis = balanceData?.available_btc || 0;
  const availableBtc = availableBtcSatoshis / 100000000; // Convert satoshis to BTC
  const sellRate = sellRateInr || 0;
  const inrValue = availableBtc * sellRate;

  const toggleAmount = () => {
    setShowInr(!showInr);
  };

  if (isLoading) {
    return (
      <div className={`bg-black pt-8 pb-10 px-4 ${className}`}>
        <div className="text-center">          
          {/* Main value loading skeleton */}
          <div className="flex items-center justify-center mb-0">
            <div className="h-16 w-48 bg-gray-800 rounded animate-pulse"></div>
          </div>

          {/* Cash balance loading skeleton */}
          <div className="flex items-center justify-center mb-6">
            <div className="h-6 w-40 bg-gray-700 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-black pt-6 pb-10 px-4 ${className}`}>
      <div className="text-center">       
        {/* Clickable Main Amount - Toggle between BTC and INR */}
        <div className="flex items-center justify-center mb-2">
          <button 
            onClick={toggleAmount}
            className="text-white text-5xl font-medium hover:opacity-80 transition-opacity duration-200 focus:outline-none"
          >
            {showInr ? (
              <AnimateINR value={inrValue} className="text-5xl font-medium text-white" />
            ) : (
              <AnimateBTC value={availableBtcSatoshis} className="text-5xl font-medium text-white" />
            )}
          </button>
        </div>
        
        {/* Cash Balance Button */}
        <div className="flex items-center justify-center mb-6">
          <button 
            onClick={onMaxClick}
            className="bg-btn-secondary text-white px-4 py-2 text-xs font-normal inline-flex items-center justify-center min-w-fit rounded-xl hover:bg-btn-secondary-hover transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 focus:ring-offset-black"
          >
            Cash Balance: <AnimateINR value={balanceData?.available_inr || 0} className="ml-1 text-xs font-normal text-white" />
            <ChevronDown className="w-4 h-4 ml-1 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default HeroAmount;
