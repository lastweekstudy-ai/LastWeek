import React, { useState, useEffect, useCallback } from 'react';
import { getUserStorageUsage } from '../appwrite/database';
import { StorageIcon, WarningIcon } from './Icons';

// Cache storage data for 5 minutes to avoid repeated API calls
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
let storageCache = null;
let cacheTimestamp = null;

const StorageIndicator = ({ userId, className = "", lazy = false }) => {
  const [storageData, setStorageData] = useState(null);
  const [loading, setLoading] = useState(!lazy);
  const [visible, setVisible] = useState(!lazy);

  const loadStorageData = useCallback(async () => {
    if (!userId) return;

    // Check cache first
    const now = Date.now();
    if (storageCache && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION) {
      setStorageData(storageCache);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await getUserStorageUsage(userId);
      
      // Update cache
      storageCache = data;
      cacheTimestamp = now;
      
      setStorageData(data);
    } catch (error) {
      console.error('Failed to load storage data:', error);
      // Use fallback data to prevent UI breaking
      const fallbackData = {
        totalSessions: 0,
        totalMessages: 0,
        totalFlashcards: 0,
        totalSizeBytes: 0,
        totalSizeMB: '0.00'
      };
      setStorageData(fallbackData);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (visible && userId) {
      loadStorageData();
    }
  }, [visible, userId, loadStorageData]);

  // Lazy loading - only load when component becomes visible
  useEffect(() => {
    if (lazy && !visible) {
      const timer = setTimeout(() => {
        setVisible(true);
      }, 1000); // Delay loading by 1 second
      
      return () => clearTimeout(timer);
    }
  }, [lazy, visible]);

  // Refresh cache when storage operations happen
  useEffect(() => {
    const handleStorageUpdate = () => {
      // Clear cache to force refresh
      storageCache = null;
      cacheTimestamp = null;
      if (visible) {
        loadStorageData();
      }
    };

    // Listen for custom storage update events
    window.addEventListener('storageUpdated', handleStorageUpdate);
    return () => window.removeEventListener('storageUpdated', handleStorageUpdate);
  }, [visible, loadStorageData]);

  if (!visible) {
    return null;
  }

  if (loading || !storageData) {
    return (
      <div className={`storage-indicator loading ${className}`}>
        <StorageIcon size={16} />
        <span>...</span>
      </div>
    );
  }

  const sizeMB = parseFloat(storageData.totalSizeMB);
  const maxSizeMB = 100; // Assume 100MB limit for free tier
  const usagePercentage = (sizeMB / maxSizeMB) * 100;
  const isNearLimit = usagePercentage > 80;
  const isOverLimit = usagePercentage > 100;

  return (
    <div className={`storage-indicator ${isNearLimit ? 'warning' : ''} ${isOverLimit ? 'danger' : ''} ${className}`}>
      <div className="storage-info">
        <div className="storage-header">
          <StorageIcon size={16} />
          <span className="storage-text">
            {storageData.totalSizeMB} MB
          </span>
          {isNearLimit && <WarningIcon size={14} />}
        </div>
        
        <div className="storage-bar">
          <div 
            className="storage-fill" 
            style={{ width: `${Math.min(usagePercentage, 100)}%` }}
          />
        </div>
        
        {!className.includes('compact') && (
          <div className="storage-details">
            <span className="text-sm">
              {storageData.totalSessions} sessions • {storageData.totalMessages} messages
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper function to trigger storage updates
export const triggerStorageUpdate = () => {
  window.dispatchEvent(new CustomEvent('storageUpdated'));
};

export default StorageIndicator;