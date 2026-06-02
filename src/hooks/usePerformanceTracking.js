import { useCallback } from 'react';
import { createFlashcard, updateFlashcard } from '../appwrite/database';
import { upsertStudySchedule } from '../appwrite/studySchedule';
import { getNextReviewDate } from '../utils/spacedRepetition';

/**
 * usePerformanceTracking
 *
 * Provides callbacks for tracking:
 * - Flashcard confidence ratings → saves to flashcards + study_schedule (with limit check)
 * - MCQ answers → saves to study_schedule (with limit check)
 */
const usePerformanceTracking = ({ userId, sessionId, subject, activeSession, onNextCard }) => {

  /**
   * Called when user rates a flashcard (1=hard, 2=okay, 3=easy).
   * Saves the card to DB with SRS schedule.
   * NOTE: flashcardsCreated is counted at generation time (useSessionWithLimits),
   * not here — to prevent the loophole of generating unlimited cards without rating.
   */
  const handleFlashcardRate = useCallback(async (confidence, front, back) => {
    if (!userId || !sessionId) return;

    try {
      // Save flashcard to DB (no limit check here — already counted at generation)
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
    } catch (err) {
      console.error('[usePerformanceTracking] flashcard save failed:', err.message);
    }

    if (onNextCard) {
      const confidenceLabel = confidence === 1 ? 'hard' : confidence === 2 ? 'okay' : 'easy';
      onNextCard(confidenceLabel);
    }
  }, [userId, sessionId, subject, onNextCard]);

  /**
   * Called when user answers an MCQ (isCorrect: bool, questionText: string).
   * Updates spaced repetition schedule only.
   * NOTE: mcqsAnswered is counted at generation time (useSessionWithLimits),
   * not here — to prevent the loophole of generating unlimited MCQs without answering.
   */
  const handleMCQAnswer = useCallback(async (isCorrect, questionText) => {
    if (!userId || !sessionId) return;

    try {
      // Update SRS schedule based on answer correctness (no limit check needed)
      const confidence = isCorrect ? 3 : 1;
      const topic = questionText ? questionText.substring(0, 80) : (subject || 'General');
      await upsertStudySchedule(userId, sessionId, subject || 'General', topic, confidence);
    } catch (err) {
      console.error('[usePerformanceTracking] MCQ save failed:', err.message);
    }
  }, [userId, sessionId, subject]);

  return { handleFlashcardRate, handleMCQAnswer };
};

export default usePerformanceTracking;
