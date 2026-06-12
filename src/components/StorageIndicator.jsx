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
      <div className={`inline-flex items-center gap-2 rounded-full border border-surface-200 bg-white px-3 py-1.5 text-xs font-semibold text-surface-500 shadow-soft dark:border-surface-800 dark:bg-surface-900 dark:text-surface-400 ${className}`}>
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
    <div className={`w-full rounded-2xl border border-surface-200 bg-white p-3 shadow-soft dark:border-surface-800 dark:bg-surface-900 ${className}`}>
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-surface-700 dark:text-surface-200">
          <StorageIcon size={16} />
          <span>
            {storageData.totalSizeMB} MB
          </span>
          {isNearLimit && <span className={isOverLimit ? 'text-red-500' : 'text-amber-500'}><WarningIcon size={14} /></span>}
        </div>
        
        <div className="h-2 overflow-hidden rounded-full bg-surface-100 dark:bg-surface-800">
          <div 
            className={`h-full rounded-full transition-all ${isOverLimit ? 'bg-red-500' : isNearLimit ? 'bg-amber-500' : 'bg-brand-500'}`}
            style={{ width: `${Math.min(usagePercentage, 100)}%` }}
          />
        </div>
        
        {!className.includes('compact') && (
          <div className="text-xs text-surface-500 dark:text-surface-400">
            <span>
              {storageData.totalSessions} sessions · {storageData.totalMessages} messages
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
