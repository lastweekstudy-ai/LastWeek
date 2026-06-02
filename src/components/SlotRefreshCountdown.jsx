import React, { useState, useEffect } from 'react';

/**
 * Calculate time until next US Eastern midnight
 * Returns hours, minutes, seconds
 */
const getTimeUntilEasternMidnight = () => {
  const now = new Date();
  
  // US Eastern Time is UTC-5 (EST) or UTC-4 (EDT)
  // For simplicity, we'll use EST (UTC-5)
  // In production, you'd want to use proper timezone detection
  
  // Get current UTC time
  const utcNow = now.getTime() + now.getTimezoneOffset() * 60 * 1000;
  
  // Convert to Eastern Time (UTC-5)
  const easternOffset = -5 * 60 * 60 * 1000; // -5 hours in milliseconds
  const easternTime = new Date(utcNow + easternOffset);
  
  // Calculate midnight Eastern Time
  const easternMidnight = new Date(easternTime);
  easternMidnight.setHours(24, 0, 0, 0); // Set to next midnight
  
  // Calculate difference
  const diff = easternMidnight.getTime() - easternTime.getTime();
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  
  return { hours, minutes, seconds, diff };
};

/**
 * Get user's local timezone name
 */
const getLocalTimezone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'Local Time';
  }
};

/**
 * SlotRefreshCountdown - Shows countdown until slots refresh (US Eastern midnight)
 */
const SlotRefreshCountdown = ({ showLabel = true }) => {
  const [countdown, setCountdown] = useState(getTimeUntilEasternMidnight());

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(getTimeUntilEasternMidnight());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (num) => String(num).padStart(2, '0');
  
  const localTimezone = getLocalTimezone();

  if (countdown.diff <= 0) {
    return (
      <span style={{ color: '#10b981', fontSize: '0.85rem' }}>
        Slots refreshed! Refresh the page.
      </span>
    );
  }

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '0.25rem',
      marginTop: '0.5rem' 
    }}>
      {showLabel && (
        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
          Slots refresh at midnight US Eastern:
        </span>
      )}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '0.5rem' 
      }}>
        <span style={{ 
          fontFamily: 'monospace', 
          fontSize: '1rem', 
          fontWeight: 600,
          color: 'var(--color-accent)',
          backgroundColor: 'rgba(var(--color-accent-rgb), 0.1)',
          padding: '0.25rem 0.5rem',
          borderRadius: '4px',
        }}>
          {formatTime(countdown.hours)}:{formatTime(countdown.minutes)}:{formatTime(countdown.seconds)}
        </span>
        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
          until refresh
        </span>
      </div>
      <span style={{ color: 'var(--color-text-muted)', fontSize: '0.7rem' }}>
        ({localTimezone})
      </span>
    </div>
  );
};

export default SlotRefreshCountdown;
