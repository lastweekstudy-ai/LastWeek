import { useState, useEffect, useCallback, useRef } from 'react';
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
  // Prevent duplicate checks for the same user ID
  const checkedUserRef = useRef(null);

  const normalLimits = useUsageLimits();
  const testingLimits = useTestingLimits();

  // Check if user is in testing mode — runs once per user ID change
  useEffect(() => {
    const checkMode = async () => {
      if (!user?.$id) {
        setCheckingMode(false);
        setIsTestingMode(false);
        checkedUserRef.current = null;
        return;
      }

      // Skip if we already checked this user ID
      if (checkedUserRef.current === user.$id) {
        return;
      }
      checkedUserRef.current = user.$id;
      setCheckingMode(true);

      try {
        const testingDoc = await getTestingUsageDoc(user.$id);
        const isTesting = testingDoc !== null && testingDoc.addedToPreReg !== true;
        setIsTestingMode(isTesting);
      } catch (err) {
        console.error('[useCombinedLimits] Failed to check mode:', err.message);
        setIsTestingMode(false);
      } finally {
        setCheckingMode(false);
      }
    };

    checkMode();
  }, [user?.$id]);

  // Determine which hook to use
  const activeHook = isTestingMode ? testingLimits : normalLimits;

  const canDo = useCallback((action) => {
    return activeHook.canDo(action);
  }, [activeHook]);

  const recordUsage = useCallback(async (action, amount = 1) => {
    return activeHook.recordUsage(action, amount);
  }, [activeHook]);

  const refresh = useCallback(() => {
    // Reset the check guard so the next call re-checks testing mode too
    checkedUserRef.current = null;
    if (isTestingMode) {
      testingLimits.refresh();
    } else {
      normalLimits.refresh();
    }
  }, [isTestingMode, testingLimits, normalLimits]);

  const loading = checkingMode || normalLimits.loading || testingLimits.loading;

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
