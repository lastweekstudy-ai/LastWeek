import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { getMonthlyUsage, incrementUsage } from '../appwrite/usageTracking';
import { getUserSubscription, isSubscriptionActive } from '../appwrite/subscription';
import { getPlanLimits, getUserPlan, isWithinLimit, getRemaining, formatLimit } from '../config/planLimits';

/**
 * useUsageLimits — Central hook for checking and enforcing usage limits.
 *
 * Returns:
 *   plan        — current plan ID ('free', 'pro', 'plus', 'proplus')
 *   limits      — the plan's limit config object
 *   usage       — current month's usage counts
 *   loading     — true while fetching
 *   canDo(action) — returns { allowed: bool, remaining: number, limit: number }
 *   recordUsage(action) — increments the counter (call AFTER the action succeeds)
 *   refresh()   — re-fetch usage data
 */
const useUsageLimits = () => {
  const { user } = useAuth();
  const [plan, setPlan] = useState('free');
  const [limits, setLimits] = useState(getPlanLimits('free'));
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const fetchedRef = useRef(false);

  const loadData = useCallback(async () => {
    if (!user?.$id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Load subscription and usage in parallel
      const [subscription, monthlyUsage] = await Promise.all([
        getUserSubscription(user.$id),
        getMonthlyUsage(user.$id),
      ]);

      const activeSub = subscription && isSubscriptionActive(subscription) ? subscription : null;
      const userPlan = getUserPlan(user, activeSub);

      setPlan(userPlan);
      setLimits(getPlanLimits(userPlan));
      setUsage(monthlyUsage);
    } catch (err) {
      console.error('[useUsageLimits] Failed to load:', err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user?.$id && !fetchedRef.current) {
      fetchedRef.current = true;
      loadData();
    }
  }, [user, loadData]);

  /**
   * Check if the user can perform an action.
   * @param {'sessions'|'messages'|'pdfs'|'audios'|'flashcards'|'mcqs'|'tts'|'examPlans'|'languageLearning'} action
   * @returns {{ allowed: boolean, remaining: number|Infinity, limit: number|Infinity, current: number }}
   */
  const canDo = useCallback((action) => {
    if (!usage || !limits) {
      return { allowed: true, remaining: Infinity, limit: Infinity, current: 0 };
    }

    // Special case: language learning is a boolean, not a counter
    if (action === 'languageLearning') {
      return { allowed: limits.languageLearning, remaining: limits.languageLearning ? Infinity : 0, limit: limits.languageLearning ? Infinity : 0, current: 0 };
    }

    // Map action to usage field and limit field
    const mapping = {
      sessions: { usageField: 'sessionsCreated', limitField: 'sessions' },
      messages: { usageField: 'messagesUsed', limitField: 'messages' },
      pdfs: { usageField: 'pdfsUploaded', limitField: 'pdfs' },
      audios: { usageField: 'audiosUploaded', limitField: 'audios' },
      flashcards: { usageField: 'flashcardsCreated', limitField: 'flashcards' },
      mcqs: { usageField: 'mcqsAnswered', limitField: 'mcqs' },
      examPlans: { usageField: 'examPlansActive', limitField: 'examPlans' },
    };

    const map = mapping[action];
    if (!map) return { allowed: true, remaining: Infinity, limit: Infinity, current: 0 };

    const current = usage[map.usageField] || 0;
    const limit = limits[map.limitField];
    const allowed = isWithinLimit(current, limit);
    const remaining = getRemaining(current, limit);

    return { allowed, remaining, limit, current };
  }, [usage, limits]);

  /**
   * Record that an action was performed (increment counter).
   * Call this AFTER the action succeeds, not before.
   */
  const recordUsage = useCallback(async (action, amount = 1) => {
    if (!user?.$id) return;

    const fieldMapping = {
      sessions: 'sessionsCreated',
      messages: 'messagesUsed',
      pdfs: 'pdfsUploaded',
      audios: 'audiosUploaded',
      flashcards: 'flashcardsCreated',
      mcqs: 'mcqsAnswered',
    };

    const field = fieldMapping[action];
    if (!field) return;

    // Update local state immediately (optimistic)
    setUsage(prev => prev ? { ...prev, [field]: (prev[field] || 0) + amount } : prev);

    // Update database
    await incrementUsage(user.$id, field, amount);
  }, [user]);

  /**
   * Refresh usage data from database.
   */
  const refresh = useCallback(() => {
    fetchedRef.current = false;
    loadData();
  }, [loadData]);

  return {
    plan,
    planName: limits.name,
    limits,
    usage,
    loading,
    canDo,
    recordUsage,
    refresh,
    formatLimit,
  };
};

export default useUsageLimits;
