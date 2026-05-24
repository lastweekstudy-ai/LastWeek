import { useCallback } from 'react';
import { createFlashcard, updateFlashcard } from '../appwrite/database';
import { upsertStudySchedule } from '../appwrite/studySchedule';
import { getNextReviewDate } from '../utils/spacedRepetition';
import { getMonthlyUsage, incrementUsage } from '../appwrite/usageTracking';
import { getPlanLimits } from '../config/planLimits';
import { getUserSubscription, isSubscriptionActive } from '../appwrite/subscription';

/**
 * usePerformanceTracking
 *
 * Provides callbacks for tracking:
 * - Flashcard confidence ratings → saves to flashcards + study_schedule (with limit check)
 * - MCQ answers → saves to study_schedule (with limit check)
 */
const usePerformanceTracking = ({ userId, sessionId, subject, activeSession, onNextCard }) => {

  const getUserPlanLimits = useCallback(async () => {
    if (!userId) return getPlanLimits('free');
    try {
      const subscription = await getUserSubscription(userId);
      const activeSub = subscription && isSubscriptionActive(subscription) ? subscription : null;
      return getPlanLimits(activeSub?.plan || 'free');
    } catch {
      return getPlanLimits('free');
    }
  }, [userId]);

  /**
   * Called when user rates a flashcard (1=hard, 2=okay, 3=easy)
   * Checks monthly flashcard limit, then saves to DB with SRS schedule.
   */
  const handleFlashcardRate = useCallback(async (confidence, front, back) => {
    if (!userId || !sessionId) return;

    try {
      // Check flashcard limit
      const [limits, usage] = await Promise.all([
        getUserPlanLimits(),
        getMonthlyUsage(userId),
      ]);

      if (limits.flashcards !== Infinity && (usage.flashcardsCreated || 0) >= limits.flashcards) {
        console.warn('[usePerformanceTracking] Flashcard limit reached — not saving');
        return; // Silently skip (UI should already have blocked the action)
      }

      // Save flashcard to DB
      const flashcard = await createFlashcard(
        userId,
        sessionId,
        front || 'Flashcard',
        back || '',
        { source: 'ai', subject: subject || 'General' }
      );
      const nextReviewDate = getNextReviewDate(confidence);
      await updateFlashcard(flashcard.$id, confidence, nextReviewDate);

      // Update spaced repetition schedule
      const topic = front ? front.substring(0, 80) : (subject || 'General');
      await upsertStudySchedule(userId, sessionId, subject || 'General', topic, confidence);

      // Record usage
      await incrementUsage(userId, 'flashcardsCreated');
    } catch (err) {
      console.error('[usePerformanceTracking] flashcard save failed:', err.message);
    }

    if (onNextCard) {
      const confidenceLabel = confidence === 1 ? 'hard' : confidence === 2 ? 'okay' : 'easy';
      onNextCard(confidenceLabel);
    }
  }, [userId, sessionId, subject, onNextCard, getUserPlanLimits]);

  /**
   * Called when user answers an MCQ (isCorrect: bool, questionText: string)
   * Checks monthly MCQ limit, then updates spaced repetition schedule.
   */
  const handleMCQAnswer = useCallback(async (isCorrect, questionText) => {
    if (!userId || !sessionId) return;

    try {
      // Check MCQ limit
      const [limits, usage] = await Promise.all([
        getUserPlanLimits(),
        getMonthlyUsage(userId),
      ]);

      if (limits.mcqs !== Infinity && (usage.mcqsAnswered || 0) >= limits.mcqs) {
        console.warn('[usePerformanceTracking] MCQ limit reached — not recording');
        return; // Silently skip
      }

      const confidence = isCorrect ? 3 : 1;
      const topic = questionText ? questionText.substring(0, 80) : (subject || 'General');
      await upsertStudySchedule(userId, sessionId, subject || 'General', topic, confidence);

      // Record usage
      await incrementUsage(userId, 'mcqsAnswered');
    } catch (err) {
      console.error('[usePerformanceTracking] MCQ save failed:', err.message);
    }
  }, [userId, sessionId, subject, getUserPlanLimits]);

  return { handleFlashcardRate, handleMCQAnswer };
};

export default usePerformanceTracking;
