import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import useUsageLimits from './useUsageLimits';
import useTestingLimits from './useTestingLimits';
import { getTestingUsageDoc } from '../appwrite/admin';

/**
 * useCombinedLimits — Hook that handles both normal limits and testing limits.
 * 
 * Automatically detects if user is in testing mode and uses the appropriate limits.
 * 
 * Returns:
 *   isTestingMode  — true if user is in testing mode
 *   plan           — current plan ID (or 'testing')
 *   planName       — display name of current plan
 *   limits         — the current limits config object
 *   usage          — current usage counts
 *   loading        — true while fetching
 *   canDo(action)  — returns { allowed: bool, remaining: number, limit: number }
 *   recordUsage(action) — increments the counter (call AFTER the action succeeds)
 *   refresh()      — re-fetch usage data
 */
const useCombinedLimits = () => {
  const { user } = useAuth();
  const [isTestingMode, setIsTestingMode] = useState(false);
  const [checkingMode, setCheckingMode] = useState(true);
  
  const normalLimits = useUsageLimits();
  const testingLimits = useTestingLimits();

  // Check if user is in testing mode
  useEffect(() => {
    const checkMode = async () => {
      if (!user?.$id) {
        setCheckingMode(false);
        setIsTestingMode(false);
        return;
      }

      // Always re-check on mount/refresh - don't use ref guard
      setCheckingMode(true);

      try {
        console.log('[useCombinedLimits] Checking mode for user:', user.$id);
        const testingDoc = await getTestingUsageDoc(user.$id);
        console.log('[useCombinedLimits] Testing doc result:', testingDoc);
        
        // User is in testing mode if they have a testing doc and haven't been added to pre-reg yet
        console.log('[useCombinedLimits] testingDoc exists:', testingDoc !== null);
        console.log('[useCombinedLimits] addedToPreReg:', testingDoc?.addedToPreReg);
        const isTesting = testingDoc !== null && testingDoc.addedToPreReg !== true;
        console.log('[useCombinedLimits] isTestingMode:', isTesting);
        setIsTestingMode(isTesting);
      } catch (err) {
        console.error('[useCombinedLimits] Failed to check mode:', err.message);
        setIsTestingMode(false);
      } finally {
        setCheckingMode(false);
      }
    };

    checkMode();
  }, [user?.$id]); // Re-run when user ID changes

  // Determine which hook to use
  const activeHook = isTestingMode ? testingLimits : normalLimits;

  /**
   * Check if the user can perform an action.
   */
  const canDo = useCallback((action) => {
    console.log('[useCombinedLimits] canDo called:', { action, isTestingMode, loading: checkingMode || normalLimits.loading || testingLimits.loading });
    return activeHook.canDo(action);
  }, [activeHook, isTestingMode, checkingMode, normalLimits.loading, testingLimits.loading]);

  /**
   * Record that an action was performed.
   */
  const recordUsage = useCallback(async (action, amount = 1) => {
    return activeHook.recordUsage(action, amount);
  }, [activeHook]);

  /**
   * Refresh usage data.
   */
  const refresh = useCallback(() => {
    if (isTestingMode) {
      testingLimits.refresh();
    } else {
      normalLimits.refresh();
    }
  }, [isTestingMode, testingLimits, normalLimits]);

  const loading = checkingMode || normalLimits.loading || testingLimits.loading;
  
  console.log('[useCombinedLimits] Current state:', {
    isTestingMode,
    checkingMode,
    normalLimitsLoading: normalLimits.loading,
    testingLimitsLoading: testingLimits.loading,
    loading
  });

  return {
    isTestingMode,
    plan: isTestingMode ? 'testing' : normalLimits.plan,
    planName: isTestingMode ? 'Testing Mode' : normalLimits.planName,
    limits: isTestingMode ? testingLimits.limits : normalLimits.limits,
    usage: isTestingMode ? testingLimits.usage : normalLimits.usage,
    loading,
    canDo,
    recordUsage,
    refresh,
    // Pass through testing-specific properties
    hasSubmittedReview: testingLimits.hasSubmittedReview,
    setHasSubmittedReview: testingLimits.setHasSubmittedReview,
    getFeatureName: testingLimits.getFeatureName,
    getFeatureDescription: testingLimits.getFeatureDescription,
    formatLimit: isTestingMode 
      ? (limit) => testingLimits.formatTestingLimit?.(limit) ?? limit 
      : normalLimits.formatLimit,
  };
};

export default useCombinedLimits;
