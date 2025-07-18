import React from 'react';
import NumberFlow from '@number-flow/react';

interface AnimateNumberFlowProps {
  value: number;
  className?: string;
}

export const AnimateUSD: React.FC<AnimateNumberFlowProps> = ({ value, className = '' }) => {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <span>$</span>
      <NumberFlow
        value={value}
        format={{
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }}
      />
    </div>
  );
};

export const AnimateINR: React.FC<AnimateNumberFlowProps> = ({ value, className = '' }) => {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <span>₹</span>
      <NumberFlow
        value={value}
        format={{
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }}
        locales="en-IN"
      />
    </div>
  );
};

export const AnimateBTC: React.FC<AnimateNumberFlowProps> = ({ value, className = '' }) => {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <span>₿</span>
      <NumberFlow
        value={value*0.00000001}
        format={{
          minimumFractionDigits: 0,
          maximumFractionDigits: 8
        }}
      />
    </div>
  );
};

// Default export for convenience
const AnimateNumberFlow = {
  USD: AnimateUSD,
  INR: AnimateINR,
  BTC: AnimateBTC
};

export default AnimateNumberFlow;
