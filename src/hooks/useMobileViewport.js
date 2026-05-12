import { useState, useEffect, useCallback } from 'react';

/**
 * Hook to handle mobile viewport issues, particularly keyboard showing/hiding
 * and ensuring content remains visible and scrollable on mobile devices.
 */
const useMobileViewport = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);
  const [activeElement, setActiveElement] = useState(null);

  // Check if device is mobile
  const checkIsMobile = useCallback(() => {
    const mobile = window.innerWidth <= 768;
    setIsMobile(mobile);
    return mobile;
  }, []);

  // Handle viewport resize
  const handleResize = useCallback(() => {
    const isMobileNow = checkIsMobile();
    const newHeight = window.innerHeight;
    const newWidth = window.innerWidth;
    
    setViewportHeight(newHeight);
    
    // Detect keyboard visibility on mobile
    if (isMobileNow) {
      // On mobile, keyboard shows when viewport height decreases significantly
      const keyboardThreshold = 300; // pixels
      const initialHeight = Math.max(document.documentElement.clientHeight, window.innerHeight);
      
      if (newHeight < initialHeight - keyboardThreshold) {
        setKeyboardVisible(true);
      } else {
        setKeyboardVisible(false);
      }
    }
  }, [checkIsMobile]);

  // Handle focus events to track active input
  const handleFocus = useCallback((event) => {
    const target = event.target;
    const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
    
    if (isInput && isMobile) {
      setActiveElement(target);
      
      // Scroll input into view on mobile
      setTimeout(() => {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [isMobile]);

  // Handle blur events
  const handleBlur = useCallback(() => {
    setActiveElement(null);
  }, []);

  // Apply viewport fixes for mobile
  const applyViewportFixes = useCallback(() => {
    if (!isMobile) return;

    // Fix for iOS Safari 100vh issue
    const setVh = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    setVh();
    window.addEventListener('resize', setVh);

    // Prevent zoom on input focus in iOS
    const inputs = document.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
      input.addEventListener('focus', () => {
        // iOS zoom prevention
        const viewport = document.querySelector('meta[name="viewport"]');
        if (viewport) {
          viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
        }
      });
      
      input.addEventListener('blur', () => {
        // Restore normal viewport
        const viewport = document.querySelector('meta[name="viewport"]');
        if (viewport) {
          viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover');
        }
      });
    });

    return () => {
      window.removeEventListener('resize', setVh);
      inputs.forEach(input => {
        input.removeEventListener('focus', () => {});
        input.removeEventListener('blur', () => {});
      });
    };
  }, [isMobile]);

  // Initialize
  useEffect(() => {
    checkIsMobile();
    applyViewportFixes();

    // Add event listeners
    window.addEventListener('resize', handleResize);
    window.addEventListener('focus', handleFocus, true);
    window.addEventListener('blur', handleBlur, true);

    // Visual viewport API for mobile browsers
    if (window.visualViewport) {
      const handleVisualViewportChange = () => {
        if (isMobile) {
          const visualViewport = window.visualViewport;
          setViewportHeight(visualViewport.height);
          
          // Adjust fixed elements when keyboard is visible
          if (visualViewport.height < window.innerHeight * 0.7) {
            setKeyboardVisible(true);
            
            // Adjust chat input area
            const chatInputArea = document.querySelector('.chat-input-area');
            if (chatInputArea) {
              chatInputArea.style.bottom = `${window.innerHeight - visualViewport.height}px`;
            }
          } else {
            setKeyboardVisible(false);
            
            // Reset chat input area
            const chatInputArea = document.querySelector('.chat-input-area');
            if (chatInputArea) {
              chatInputArea.style.bottom = '0';
            }
          }
        }
      };
      
      window.visualViewport.addEventListener('resize', handleVisualViewportChange);
      window.visualViewport.addEventListener('scroll', handleVisualViewportChange);
      
      return () => {
        window.visualViewport.removeEventListener('resize', handleVisualViewportChange);
        window.visualViewport.removeEventListener('scroll', handleVisualViewportChange);
      };
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('focus', handleFocus, true);
      window.removeEventListener('blur', handleBlur, true);
    };
  }, [checkIsMobile, applyViewportFixes, handleResize, handleFocus, handleBlur, isMobile]);

  // Function to scroll element into view on mobile
  const scrollIntoViewMobile = useCallback((element, options = {}) => {
    if (!isMobile) {
      element.scrollIntoView(options);
      return;
    }

    // Mobile-optimized scrolling
    const defaultOptions = {
      behavior: 'smooth',
      block: 'center',
      inline: 'nearest'
    };
    
    const mergedOptions = { ...defaultOptions, ...options };
    
    // Add offset for fixed headers on mobile
    const headerHeight = 60; // Approximate navbar height
    const elementRect = element.getBoundingClientRect();
    const offsetPosition = elementRect.top + window.pageYOffset - headerHeight;
    
    window.scrollTo({
      top: offsetPosition,
      behavior: mergedOptions.behavior
    });
  }, [isMobile]);

  // Function to adjust viewport when keyboard is shown
  const adjustForKeyboard = useCallback((inputElement) => {
    if (!isMobile || !inputElement) return;

    // Scroll input into view
    scrollIntoViewMobile(inputElement, { block: 'center' });
    
    // Add padding to prevent content from being hidden
    const scrollableContainer = inputElement.closest('.chat-messages-improved') || 
                               inputElement.closest('.mode-content') ||
                               document.querySelector('main');
    
    if (scrollableContainer) {
      const originalPaddingBottom = scrollableContainer.style.paddingBottom;
      scrollableContainer.style.paddingBottom = '200px'; // Extra space for keyboard
      
      // Restore original padding when input loses focus
      const restorePadding = () => {
        scrollableContainer.style.paddingBottom = originalPaddingBottom;
        inputElement.removeEventListener('blur', restorePadding);
      };
      
      inputElement.addEventListener('blur', restorePadding);
    }
  }, [isMobile, scrollIntoViewMobile]);

  return {
    isMobile,
    keyboardVisible,
    viewportHeight,
    activeElement,
    scrollIntoViewMobile,
    adjustForKeyboard,
    checkIsMobile
  };
};

export default useMobileViewport;