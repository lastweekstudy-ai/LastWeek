import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { getTestingUsage, incrementTestingUsage, getTestingUsageDoc } from '../appwrite/admin';
import { TESTING_LIMITS, isWithinTestingLimit, getTestingRemaining, formatTestingLimit, getFeatureName, getFeatureDescription } from '../config/testingLimits';

/**
 * useTestingLimits — Hook for users in "testing" mode during pre-registration.
 * 
 * These are ONE-TIME limits, not monthly. Used when a user claims a free testing slot.
 * 
 * Returns:
 *   isTestingMode  — true if user is in testing mode
 *   usage          — current usage counts
 *   limits         — the testing limits config
 *   loading        — true while fetching
 *   canDo(action)  — returns { allowed: bool, remaining: number, limit: number }
 *   recordUsage(action) — increments the counter (call AFTER the action succeeds)
 *   refresh()      — re-fetch usage data
 *   hasSubmittedReview — true if user already submitted their review
 */
const useTestingLimits = () => {
  const { user } = useAuth();
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasSubmittedReview, setHasSubmittedReview] = useState(false);
  const fetchedRef = useRef(false);

  const loadData = useCallback(async () => {
    if (!user?.$id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const usageDoc = await getTestingUsageDoc(user.$id);
      
      if (usageDoc) {
        setUsage({
          sessions: usageDoc.sessions || 0,
          pdfs: usageDoc.pdfs || 0,
          audios: usageDoc.audios || 0,
          messages: usageDoc.messages || 0,
          flashcards: usageDoc.flashcards || 0,
          mcqs: usageDoc.mcqs || 0,
          examPlans: usageDoc.examPlans || 0,
          languageLearningSessions: usageDoc.languageLearningSessions || 0,
          libraryImports: usageDoc.libraryImports || 0,
        });
        setHasSubmittedReview(usageDoc.hasReviewed || false);
      } else {
        // No testing usage doc means user is not in testing mode
        setUsage(null);
      }
    } catch (err) {
      console.error('[useTestingLimits] Failed to load:', err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    // Only fetch if we haven't already for this user.
    // useCombinedLimits also calls getTestingUsageDoc — this ref prevents a second
    // redundant call from this hook for the same user.
    if (user?.$id && !fetchedRef.current) {
      fetchedRef.current = true;
      loadData();
    } else if (!user?.$id) {
      fetchedRef.current = false;
      setUsage(null);
      setLoading(false);
    }
  }, [user?.$id]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Check if the user can perform an action in testing mode.
   */
  const canDo = useCallback((action) => {
    if (!usage) {
      return { allowed: false, remaining: 0, limit: 0, current: 0, isTestingMode: false };
    }

    // Map action to usage field
    const fieldMapping = {
      sessions: 'sessions',
      pdfs: 'pdfs',
      audios: 'audios',
      messages: 'messages',
      flashcards: 'flashcards',
      mcqs: 'mcqs',
      examPlans: 'examPlans',
      languageLearningSessions: 'languageLearningSessions',
      libraryImports: 'libraryImports',
    };

    const field = fieldMapping[action];
    if (!field) return { allowed: true, remaining: Infinity, limit: Infinity, current: 0, isTestingMode: true };

    const current = usage[field] || 0;
    const limit = TESTING_LIMITS[field];
    const allowed = isWithinTestingLimit(current, limit);
    const remaining = getTestingRemaining(current, limit);

    return { allowed, remaining, limit, current, isTestingMode: true };
  }, [usage]);

  /**
   * Record that an action was performed (increment counter).
   */
  const recordUsage = useCallback(async (action, amount = 1) => {
    if (!user?.$id || !usage) return;

    const fieldMapping = {
      sessions: 'sessions',
      pdfs: 'pdfs',
      audios: 'audios',
      messages: 'messages',
      flashcards: 'flashcards',
      mcqs: 'mcqs',
      examPlans: 'examPlans',
      languageLearningSessions: 'languageLearningSessions',
      libraryImports: 'libraryImports',
    };

    const field = fieldMapping[action];
    if (!field) return;

    // Update local state immediately (optimistic)
    setUsage(prev => prev ? { ...prev, [field]: (prev[field] || 0) + amount } : prev);

    // Update database
    await incrementTestingUsage(user.$id, field, amount);
  }, [user, usage]);

  /**
   * Check if user is in testing mode
   */
  const isTestingMode = usage !== null;

  /**
   * Refresh usage data from database.
   */
  const refresh = useCallback(() => {
    fetchedRef.current = false;
    loadData();
  }, [loadData]);

  return {
    isTestingMode,
    usage,
    limits: TESTING_LIMITS,
    loading,
    canDo,
    recordUsage,
    refresh,
    formatTestingLimit,
    getFeatureName,
    getFeatureDescription,
    hasSubmittedReview,
    setHasSubmittedReview,
  };
};

export default useTestingLimits;
