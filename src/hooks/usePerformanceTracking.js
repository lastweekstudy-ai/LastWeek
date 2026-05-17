import { useCallback } from 'react';
import { createFlashcard, updateFlashcard } from '../appwrite/database';
import { upsertStudySchedule } from '../appwrite/studySchedule';
import { getNextReviewDate } from '../utils/spacedRepetition';

/**
 * usePerformanceTracking
 *
 * Provides callbacks for tracking:
 * - Flashcard confidence ratings → saves to flashcards + study_schedule
 * - MCQ answers → saves to study_schedule
 *
 * Used by all 5 mode pages, ExamSession, and AudioLectureViewer.
 *
 * @param onNextCard {function} — optional, called after rating so the caller
 *   can send a follow-up message to the AI requesting the next card.
 */
const usePerformanceTracking = ({ userId, sessionId, subject, activeSession, onNextCard }) => {

  /**
   * Called when user rates a flashcard (1=hard, 2=okay, 3=easy)
   * Saves the flashcard to DB, updates spaced repetition schedule,
   * then calls onNextCard so the AI sends the next card in a sequence.
   */
  const handleFlashcardRate = useCallback(async (confidence, front, back) => {
    if (!userId || !sessionId) return;
    try {
      // Save flashcard to DB with correct front/back content
      const flashcard = await createFlashcard(
        userId,
        sessionId,
        front || 'Flashcard',
        back || '',
        { source: 'ai', subject: subject || 'General' }
      );
      // Update with confidence rating and spaced repetition schedule
      const nextReviewDate = getNextReviewDate(confidence);
      await updateFlashcard(flashcard.$id, confidence, nextReviewDate);

      // Update spaced repetition schedule
      const topic = front ? front.substring(0, 80) : (subject || 'General');
      await upsertStudySchedule(userId, sessionId, subject || 'General', topic, confidence);
    } catch (err) {
      console.error('[usePerformanceTracking] flashcard save failed:', err.message);
    }

    // After saving, trigger the next card if the caller provided a handler
    // (kept for backward compatibility but no longer needed for multi-card responses)
    if (onNextCard) {
      const confidenceLabel = confidence === 1 ? 'hard' : confidence === 2 ? 'okay' : 'easy';
      onNextCard(confidenceLabel);
    }
  }, [userId, sessionId, subject, onNextCard]);

  /**
   * Called when user answers an MCQ (isCorrect: bool, questionText: string)
   * Maps correct→3, wrong→1 and updates spaced repetition schedule.
   */
  const handleMCQAnswer = useCallback(async (isCorrect, questionText) => {
    if (!userId || !sessionId) return;
    try {
      const confidence = isCorrect ? 3 : 1; // correct=easy, wrong=hard
      const topic = questionText ? questionText.substring(0, 80) : (subject || 'General');
      await upsertStudySchedule(userId, sessionId, subject || 'General', topic, confidence);
    } catch (err) {
      console.error('[usePerformanceTracking] MCQ save failed:', err.message);
    }
  }, [userId, sessionId, subject]);

  return { handleFlashcardRate, handleMCQAnswer };
};

export default usePerformanceTracking;
