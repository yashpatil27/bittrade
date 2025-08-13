import React, { Suspense } from 'react';

// Lazy load BitcoinLoader to keep framer-motion out of main bundle (saves ~160kb)
const BitcoinLoader = React.lazy(() => import('./BitcoinLoader'));

const PageLoadingScreen: React.FC = () => {
  // This component is only used as a Suspense fallback
  // and gets unmounted automatically when the lazy component loads
  // No need for internal timing logic since Suspense handles the lifecycle
  return (
    <Suspense fallback={
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-7xl font-bold text-white">₿</div>
      </div>
    }>
      <BitcoinLoader />
    </Suspense>
  );
};

export default PageLoadingScreen;
