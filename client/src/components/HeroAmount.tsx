import React, { useState, useEffect } from 'react';
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
  
  // Initialize state from localStorage
  const [showInr, setShowInr] = useState(() => {
    try {
      const saved = localStorage.getItem('heroAmount-showInr');
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  // Animation state - control value to animate from 0
  const [displayValue, setDisplayValue] = useState<{btc: number, inr: number}>({btc: 0, inr: 0});
  const [isAnimating, setIsAnimating] = useState(false);

  // Calculate values
  const availableBtcSatoshis = balanceData?.available_btc || 0;
  const availableBtc = availableBtcSatoshis / 100000000; // Convert satoshis to BTC
  const sellRate = sellRateInr || 0;
  const inrValue = availableBtc * sellRate;
  
  // Update display values when data changes (but not during animation)
  useEffect(() => {
    if (!isAnimating) {
      setDisplayValue({
        btc: availableBtcSatoshis,
        inr: inrValue
      });
    }
  }, [availableBtcSatoshis, inrValue, isAnimating]);

  // Save to localStorage whenever showInr changes
  useEffect(() => {
    try {
      localStorage.setItem('heroAmount-showInr', JSON.stringify(showInr));
    } catch {
      // Handle localStorage errors gracefully
    }
  }, [showInr]);

  const toggleAmount = () => {
    setIsAnimating(true);
    setShowInr(!showInr);
    
    // Reset to 0 to start animation
    setDisplayValue({btc: 0, inr: 0});
    
    // After a brief delay, set to target values to trigger animation
    setTimeout(() => {
      setDisplayValue({
        btc: availableBtcSatoshis,
        inr: inrValue
      });
      setIsAnimating(false);
    }, 50);
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
              <AnimateINR 
                value={displayValue.inr} 
                className="text-5xl font-medium text-white" 
              />
            ) : (
              <AnimateBTC 
                value={displayValue.btc} 
                className="text-5xl font-medium text-white" 
              />
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
