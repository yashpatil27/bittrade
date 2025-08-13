import React, { useEffect, useState } from 'react';
import LoadingScreen from './LoadingScreen';

interface LoadingWrapperProps {
  isLoading: boolean;
  message?: string;
  minDisplayTime?: number; // milliseconds
  children: React.ReactNode;
}

const LoadingWrapper: React.FC<LoadingWrapperProps> = ({ 
  isLoading,
  message = "Loading...",
  minDisplayTime = 1500, // 1.5 seconds default
  children
}) => {
  const [showLoading, setShowLoading] = useState(isLoading);
  const [startTime, setStartTime] = useState<number | null>(null);

  useEffect(() => {
    if (isLoading && !startTime) {
      // Starting to load - record start time
      setStartTime(Date.now());
      setShowLoading(true);
    } else if (!isLoading && startTime) {
      // Loading finished - check if minimum time has passed
      const elapsed = Date.now() - startTime;
      const remaining = minDisplayTime - elapsed;

      if (remaining > 0) {
        // Wait for remaining time
        const timer = setTimeout(() => {
          setShowLoading(false);
          setStartTime(null);
        }, remaining);

        return () => clearTimeout(timer);
      } else {
        // Minimum time already passed
        setShowLoading(false);
        setStartTime(null);
      }
    }
  }, [isLoading, startTime, minDisplayTime]);

  if (showLoading) {
    return <LoadingScreen message={message} />;
  }

  return <>{children}</>;
};

export default LoadingWrapper;
