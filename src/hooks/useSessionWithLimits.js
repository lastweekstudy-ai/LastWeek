import { useState, useCallback } from 'react';
import useSession from './useSession';
import useCombinedLimits from './useCombinedLimits';

// ── Lightweight parsers (mirrors EnhancedMessageFormatter logic) ─────────────
// Count flashcard blocks in an AI response string
const countFlashcardsInResponse = (text) => {
  if (!text) return 0;
  const matches = text.match(/\*\*FRONT OF CARD\*\*/gi);
  return matches ? matches.length : 0;
};

// Count MCQ blocks in an AI response string
const countMCQsInResponse = (text) => {
  if (!text) return 0;
  const matches = text.match(/\[MCQ\]/gi);
  return matches ? matches.length : 0;
};

// Detect if a user message is requesting flashcard or MCQ generation
const isFlashcardRequest = (msg) => {
  if (!msg) return false;
  return /flashcard|flash card|flash me|create.*card|make.*card/i.test(msg);
};

const isMCQRequest = (msg) => {
  if (!msg) return false;
  return /\bmcq\b|multiple.?choice|quiz me|test me|quiz question/i.test(msg);
};

// Extract the requested count from a message, e.g. "give me 5 flashcards" → 5
// Defaults to 1 if no number found (conservative)
const extractRequestedCount = (msg) => {
  if (!msg) return 1;
  const m = msg.match(/\b(\d+)\b/);
  return m ? Math.min(parseInt(m[1], 10), 50) : 1; // cap at 50 to avoid absurd numbers
};

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
   * Wrapped sendMessageWithAI — enforces limits on:
   *   1. Messages (before sending)
   *   2. Flashcard generation (before sending if request detected)
   *   3. MCQ generation (before sending if request detected)
   *   4. Flashcard count (after response — counts cards in AI reply)
   *   5. MCQ count (after response — counts MCQs in AI reply)
   */
  const sendMessageWithAI = useCallback(async (userMessage, ...rest) => {
    // ── 1. Message limit ────────────────────────────────────────────────────
    const msgCheck = usageLimits.canDo('messages');
    if (!msgCheck.allowed) {
      setLimitBlocked({
        action: 'messages',
        current: msgCheck.current,
        limit: msgCheck.limit,
        planName: usageLimits.planName,
      });
      return;
    }

    // ── 2. Pre-flight: flashcard generation limit ───────────────────────────
    if (isFlashcardRequest(userMessage)) {
      const fcCheck = usageLimits.canDo('flashcards');
      if (fcCheck.limit !== Infinity) {
        const requested = extractRequestedCount(userMessage);
        // Block if: already at limit, OR requested count exceeds what's left
        if (!fcCheck.allowed || requested > fcCheck.remaining) {
          setLimitBlocked({
            action: 'flashcards',
            current: fcCheck.current,
            limit: fcCheck.limit,
            remaining: fcCheck.remaining,
            requested,
            planName: usageLimits.planName,
          });
          return;
        }
      }
    }

    // ── 3. Pre-flight: MCQ generation limit ────────────────────────────────
    if (isMCQRequest(userMessage)) {
      const mcqCheck = usageLimits.canDo('mcqs');
      if (mcqCheck.limit !== Infinity) {
        const requested = extractRequestedCount(userMessage);
        if (!mcqCheck.allowed || requested > mcqCheck.remaining) {
          setLimitBlocked({
            action: 'mcqs',
            current: mcqCheck.current,
            limit: mcqCheck.limit,
            remaining: mcqCheck.remaining,
            requested,
            planName: usageLimits.planName,
          });
          return;
        }
      }
    }

    // ── Send the message ────────────────────────────────────────────────────
    const result = await session.sendMessageWithAI(userMessage, ...rest);

    // ── 4. Record message usage ─────────────────────────────────────────────
    await usageLimits.recordUsage('messages');

    // ── 5. Count flashcards/MCQs in the AI response ─────────────────────────
    // result is an Appwrite document — the AI text is in result.content
    const responseText = result?.content || (typeof result === 'string' ? result : '');
    if (responseText.length > 0) {
      const fcCount = countFlashcardsInResponse(responseText);
      if (fcCount > 0) {
        // Record exact count generated — pre-flight already ensured they had enough
        await usageLimits.recordUsage('flashcards', fcCount);
      }

      const mcqCount = countMCQsInResponse(responseText);
      if (mcqCount > 0) {
        await usageLimits.recordUsage('mcqs', mcqCount);
      }
    }

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
