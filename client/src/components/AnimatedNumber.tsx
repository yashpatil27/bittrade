import React from 'react';
import { useAnimatedNumber } from '../hooks/useAnimatedNumber';

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  formatNumber?: (value: number) => string;
}

const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  duration = 600,
  decimals = 0,
  prefix = '',
  suffix = '',
  className = '',
  formatNumber
}) => {
  const { displayValue, isAnimating } = useAnimatedNumber(value, {
    duration,
    decimals
  });

  const formatValue = (num: number) => {
    if (formatNumber) {
      return formatNumber(num);
    }
    
    if (decimals > 0) {
      return num.toFixed(decimals);
    }
    
    return Math.round(num).toString();
  };

  return (
    <span className={`${className} ${isAnimating ? 'transition-all duration-150' : ''}`}>
      {prefix}
      {formatValue(displayValue)}
      {suffix}
    </span>
  );
};

export default AnimatedNumber;
