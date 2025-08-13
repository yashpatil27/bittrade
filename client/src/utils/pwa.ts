import { useState, useEffect } from 'react';

// Utility functions for PWA detection and safe area handling

/**
 * Detects if the app is running as a PWA (standalone mode)
 * This includes both installed PWAs and apps opened from home screen
 */
export const isPWA = (): boolean => {
  // Check if running in standalone mode (PWA)
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return true;
  }
  
  // Check if running as installed PWA on iOS Safari
  if ((window.navigator as any).standalone === true) {
    return true;
  }
  
  // Check if running in fullscreen mode (some PWAs)
  if (window.matchMedia('(display-mode: fullscreen)').matches) {
    return true;
  }
  
  return false;
};

/**
 * Gets the appropriate maxHeight calculation based on context
 * Reduces modal height only in PWA mode to prevent over-extension
 */
export const getModalMaxHeight = (baseHeight: string): string => {
  const isPWAMode = isPWA();
  
  if (isPWAMode) {
    // In PWA mode, reduce the height by 20vh
    const result = `calc(${baseHeight} - 20vh)`;
    return result;
  }
  
  // In regular browsers, use full height as before
  return baseHeight;
};

/**
 * Hook to get PWA status and listen for changes
 */
export const usePWADetection = () => {
  const [isPWAMode, setIsPWAMode] = useState(isPWA());
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const fullscreenQuery = window.matchMedia('(display-mode: fullscreen)');
    
    const handleChange = () => {
      setIsPWAMode(isPWA());
    };
    
    mediaQuery.addListener(handleChange);
    fullscreenQuery.addListener(handleChange);
    
    return () => {
      mediaQuery.removeListener(handleChange);
      fullscreenQuery.removeListener(handleChange);
    };
  }, []);
  
  return isPWAMode;
};
