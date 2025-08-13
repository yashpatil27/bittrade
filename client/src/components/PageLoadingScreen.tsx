import React, { useEffect, useState } from 'react';
import BitcoinLoader from './BitcoinLoader';

const PageLoadingScreen: React.FC = () => {
  const [showLoading, setShowLoading] = useState(true);

  useEffect(() => {
    // Force minimum display time of 2.2 seconds for page loading
    const timer = setTimeout(() => {
      setShowLoading(false);
    }, 2200);

    return () => clearTimeout(timer);
  }, []);

  // This component is only used as a Suspense fallback
  // so it will be unmounted when the lazy component loads
  // We just need to ensure it shows for minimum time
  return <BitcoinLoader />;
};

export default PageLoadingScreen;
