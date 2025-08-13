import React from 'react';

interface LoadingScreenProps {
  message?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message = "Loading..." 
}) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center animate-breathe" style={{ alignItems: 'center', paddingBottom: '10vh' }}>
      <div className="text-7xl md:text-8xl font-bold text-white animate-pulse-smooth bitcoin-glow">
        ₿
      </div>
    </div>
  );
};

export default LoadingScreen;
