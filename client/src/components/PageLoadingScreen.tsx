import React, { useEffect, useState } from 'react';
import LoadingScreen from './LoadingScreen';

const PageLoadingScreen: React.FC = () => {
  const [showLoading, setShowLoading] = useState(true);

  useEffect(() => {
    // Force minimum display time of 1.2 seconds for page loading
    const timer = setTimeout(() => {
      setShowLoading(false);
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  // This component is only used as a Suspense fallback
  // so it will be unmounted when the lazy component loads
  // We just need to ensure it shows for minimum time
  return <LoadingScreen message="Loading app..." />;
};

export default PageLoadingScreen;
