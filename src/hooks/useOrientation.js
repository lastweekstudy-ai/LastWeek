import { useState, useEffect, useCallback } from 'react';

/**
 * Hook to detect device orientation and prompt for landscape mode on mobile/tablet
 */
const useOrientation = () => {
  const [isLandscape, setIsLandscape] = useState(false);
  const [isMobileOrTablet, setIsMobileOrTablet] = useState(false);
  const [showOrientationPrompt, setShowOrientationPrompt] = useState(false);

  // Check if device is mobile or tablet
  const checkDevice = useCallback(() => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isTablet = /(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(navigator.userAgent);
    const screenWidth = window.innerWidth;
    
    // Consider devices with width <= 1024px as mobile/tablet for our purposes
    const isSmallScreen = screenWidth <= 1024;
    
    return isMobile || isTablet || isSmallScreen;
  }, []);

  // Check orientation
  const checkOrientation = useCallback(() => {
    const isLandscapeMode = window.innerWidth > window.innerHeight;
    setIsLandscape(isLandscapeMode);
    return isLandscapeMode;
  }, []);

  // Lock to landscape orientation (if supported)
  const lockLandscape = useCallback(async () => {
    try {
      if (screen.orientation && screen.orientation.lock) {
        await screen.orientation.lock('landscape');
      }
    } catch (error) {
      console.log('Orientation lock not supported or denied:', error);
    }
  }, []);

  // Unlock orientation
  const unlockOrientation = useCallback(async () => {
    try {
      if (screen.orientation && screen.orientation.unlock) {
        await screen.orientation.unlock();
      }
    } catch (error) {
      console.log('Orientation unlock not supported:', error);
    }
  }, []);

  // Initialize
  useEffect(() => {
    const isMobileDevice = checkDevice();
    setIsMobileOrTablet(isMobileDevice);
    
    const isLandscapeMode = checkOrientation();
    
    // Show prompt if on mobile/tablet and not in landscape
    if (isMobileDevice && !isLandscapeMode) {
      setShowOrientationPrompt(true);
    } else {
      setShowOrientationPrompt(false);
    }

    // Listen for orientation changes
    const handleOrientationChange = () => {
      const isLandscapeNow = checkOrientation();
      if (isMobileOrTablet && !isLandscapeNow) {
        setShowOrientationPrompt(true);
      } else {
        setShowOrientationPrompt(false);
      }
    };

    // Listen for resize events (more reliable than orientationchange)
    const handleResize = () => {
      handleOrientationChange();
    };

    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleResize);
    };
  }, [checkDevice, checkOrientation, isMobileOrTablet]);

  return {
    isLandscape,
    isMobileOrTablet,
    showOrientationPrompt,
    lockLandscape,
    unlockOrientation,
    setShowOrientationPrompt
  };
};

export default useOrientation;