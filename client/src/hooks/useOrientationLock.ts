import { useEffect } from 'react';

type OrientationLockType = 
  | 'any' 
  | 'natural' 
  | 'landscape' 
  | 'portrait' 
  | 'portrait-primary' 
  | 'portrait-secondary' 
  | 'landscape-primary' 
  | 'landscape-secondary';

// Define screen orientation interfaces without extending built-in types
interface ScreenOrientationAPI {
  lock?: (orientation: OrientationLockType) => Promise<void>;
  unlock?: () => void;
}

interface LegacyScreenAPI {
  // Legacy orientation APIs
  mozLockOrientation?: (orientation: string) => boolean;
  msLockOrientation?: (orientation: string) => boolean;
  lockOrientation?: (orientation: string) => boolean;
  mozUnlockOrientation?: () => void;
  msUnlockOrientation?: () => void;
  unlockOrientation?: () => void;
}

/**
 * React hook to lock screen orientation to portrait mode
 * Works on supported devices and browsers with Screen Orientation API
 */
export const useOrientationLock = () => {
  useEffect(() => {
    const lockOrientation = async () => {
      try {
        // Modern browsers - Screen Orientation API
        if (window.screen?.orientation?.lock) {
          await window.screen.orientation.lock('portrait-primary');
          console.log('[OrientationLock] Screen locked to portrait using Screen Orientation API');
          return;
        }

        // Legacy browser support
        const legacyScreen = window.screen as any;
        
        // Mozilla
        if (legacyScreen.mozLockOrientation) {
          legacyScreen.mozLockOrientation('portrait-primary');
          console.log('[OrientationLock] Screen locked to portrait using mozLockOrientation');
          return;
        }

        // Microsoft
        if (legacyScreen.msLockOrientation) {
          legacyScreen.msLockOrientation('portrait-primary');
          console.log('[OrientationLock] Screen locked to portrait using msLockOrientation');
          return;
        }

        // Webkit (older iOS Safari)
        if (legacyScreen.lockOrientation) {
          legacyScreen.lockOrientation('portrait-primary');
          console.log('[OrientationLock] Screen locked to portrait using lockOrientation');
          return;
        }

        console.log('[OrientationLock] Screen Orientation API not supported on this browser');
      } catch (error) {
        // Silently fail - this is expected on many browsers/devices
        console.log('[OrientationLock] Unable to lock orientation:', error);
      }
    };

    // Only attempt to lock on mobile devices
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) {
      lockOrientation();
    }

    // Cleanup function to unlock orientation on unmount
    return () => {
      try {
        if (window.screen?.orientation?.unlock) {
          window.screen.orientation.unlock();
        }

        const legacyScreen = window.screen as any;
        if (legacyScreen.mozUnlockOrientation) {
          legacyScreen.mozUnlockOrientation();
        } else if (legacyScreen.msUnlockOrientation) {
          legacyScreen.msUnlockOrientation();
        } else if (legacyScreen.unlockOrientation) {
          legacyScreen.unlockOrientation();
        }
      } catch (error) {
        // Silently fail on cleanup
      }
    };
  }, []);

  // Also provide a manual lock function
  const lockPortrait = async () => {
    try {
      if (window.screen?.orientation?.lock) {
        await window.screen.orientation.lock('portrait-primary');
        return true;
      }
      return false;
    } catch (error) {
      console.warn('[OrientationLock] Manual lock failed:', error);
      return false;
    }
  };

  return { lockPortrait };
};
