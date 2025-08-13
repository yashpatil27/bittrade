import React, { useState, useEffect, Suspense } from 'react';

// Lazy load BitcoinLoader to keep framer-motion out of main bundle (saves ~160kb)
const BitcoinLoader = React.lazy(() => import('./BitcoinLoader'));

interface LoadingWrapperProps {
  isLoading: boolean;
  message?: string;
  minDisplayTime?: number;
  children: React.ReactNode;
}

const LoadingWrapper: React.FC<LoadingWrapperProps> = ({ 
  isLoading,
  message = "Loading...",
  minDisplayTime = 2200,
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
    return (
      <Suspense fallback={
        <div className="fixed inset-0 bg-black flex items-center justify-center" style={{ paddingBottom: '5vh' }}>
          <div className="text-7xl font-bold text-white">₿</div>
        </div>
      }>
        <BitcoinLoader key={`loading-${startTime}`} />
      </Suspense>
    );
  }

  return <>{children}</>;
};

export default LoadingWrapper;
