import { useState, useEffect, useRef } from 'react';

interface UseAnimatedNumberOptions {
  duration?: number;
  decimals?: number;
  easing?: (t: number) => number;
}

export const useAnimatedNumber = (
  targetValue: number, 
  options: UseAnimatedNumberOptions = {}
) => {
  const {
    duration = 800,
    decimals = 0,
    easing = (t: number) => 1 - Math.pow(1 - t, 3) // easeOutCubic
  } = options;

  const [displayValue, setDisplayValue] = useState(targetValue);
  const [isAnimating, setIsAnimating] = useState(false);
  const rafRef = useRef<number | undefined>(undefined);
  const startTimeRef = useRef<number | undefined>(undefined);
  const startValueRef = useRef<number>(targetValue);

  useEffect(() => {
    // Don't animate if the values are the same
    if (targetValue === displayValue) {
      return;
    }

    // Cancel any existing animation
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }

    // Set up animation
    setIsAnimating(true);
    startValueRef.current = displayValue;
    startTimeRef.current = Date.now();

    const animate = () => {
      const elapsed = Date.now() - (startTimeRef.current || 0);
      const progress = Math.min(elapsed / duration, 1);

      // Apply easing function
      const easedProgress = easing(progress);

      // Calculate current value
      const currentValue = startValueRef.current + 
        (targetValue - startValueRef.current) * easedProgress;

      setDisplayValue(currentValue);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    // Cleanup function
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [targetValue, duration, easing]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return {
    displayValue,
    isAnimating,
    formattedValue: displayValue.toFixed(decimals)
  };
};

export default useAnimatedNumber;
