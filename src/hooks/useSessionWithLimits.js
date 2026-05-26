import { useState, useCallback } from 'react';
import useSession from './useSession';
import useCombinedLimits from './useCombinedLimits';

/**
 * useSessionWithLimits — wraps useSession with usage limit enforcement.
 * 
 * Drop-in replacement for useSession in mode pages.
 * Adds limit checks before session creation and message sending.
 * 
 * Uses useCombinedLimits to support both normal and testing mode users.
 * 
 * Returns everything useSession returns, plus:
 *   - limitBlocked: { action, current, limit, planName } | null
 *   - clearLimitBlock: () => void
 *   - usageLimits: the full useCombinedLimits return value
 */
const useSessionWithLimits = () => {
  const session = useSession();
  const usageLimits = useCombinedLimits();
  const [limitBlocked, setLimitBlocked] = useState(null);

  const clearLimitBlock = useCallback(() => setLimitBlocked(null), []);

  /**
   * Wrapped sendMessageWithAI — checks message limit first.
   */
  const sendMessageWithAI = useCallback(async (...args) => {
    const check = usageLimits.canDo('messages');
    if (!check.allowed) {
      setLimitBlocked({
        action: 'messages',
        current: check.current,
        limit: check.limit,
        planName: usageLimits.planName,
      });
      return; // Don't send
    }

    // Send the message
    const result = await session.sendMessageWithAI(...args);

    // Record usage after success
    await usageLimits.recordUsage('messages');

    return result;
  }, [session, usageLimits]);

  return {
    ...session,
    sendMessageWithAI,
    limitBlocked,
    clearLimitBlock,
    usageLimits,
  };
};

export default useSessionWithLimits;
