import React from 'react';
import BitcoinLoader from './BitcoinLoader';

const PageLoadingScreen: React.FC = () => {
  // This component is only used as a Suspense fallback
  // and gets unmounted automatically when the lazy component loads
  // No need for internal timing logic since Suspense handles the lifecycle
  return <BitcoinLoader />;
};

export default PageLoadingScreen;
