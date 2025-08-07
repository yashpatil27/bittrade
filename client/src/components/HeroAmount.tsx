import React from 'react';
import { useBalance } from '../context/BalanceContext';
import { usePrice } from '../context/PriceContext';
import { AnimateBTC, AnimateINR } from './AnimateNumberFlow';

interface HeroAmountProps {
  className?: string;
}

const HeroAmount: React.FC<HeroAmountProps> = ({ className = '' }) => {
  const { balanceData, isLoading } = useBalance();
  const { sellRateInr } = usePrice();

  // Calculate values
  const availableBtcSatoshis = balanceData?.available_btc || 0;
  const availableBtc = availableBtcSatoshis / 100000000; // Convert satoshis to BTC
  const sellRate = sellRateInr || 0;
  const inrValue = availableBtc * sellRate;

  if (isLoading) {
    return (
      <div className={`bg-black pt-4 pb-12 px-6 ${className}`}>
        <div className="text-center">
          {/* Subamount loading skeleton */}
          <div className="flex items-center justify-center mb-1">
            <div className="h-6 w-32 bg-gray-700 rounded animate-pulse"></div>
          </div>
          
          {/* Main value loading skeleton */}
          <div className="flex items-center justify-center mb-12">
            <div className="h-16 w-48 bg-gray-800 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-black pt-4 pb-12 px-6 ${className}`}>
      <div className="text-center">
        {/* INR Sub Amount */}
        <div className="flex items-center justify-center mb-1">
          <span className="text-white text-sm font-normal">
            <AnimateINR value={inrValue} className="text-sm font-normal text-white" />
          </span>
        </div>
        
        {/* Main Bitcoin Amount */}
        <div className="flex items-center justify-center mb-12">
          <span className="text-white text-5xl font-medium">
            <AnimateBTC value={availableBtcSatoshis} className="text-5xl font-medium text-white" />
          </span>
        </div>
      </div>
    </div>
  );
};

export default HeroAmount;
