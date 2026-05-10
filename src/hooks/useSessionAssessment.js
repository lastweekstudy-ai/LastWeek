import { useState, useEffect, useRef } from 'react';
import { getSessionContext, saveSessionContext } from '../appwrite/sessionContext';

/**
 * Shared hook that handles the session assessment flow for all mode pages.
 * - Checks once (on mount) whether the session needs an assessment
 * - Exposes showAssessment, handleAssessmentComplete, handleAssessmentSkip
 */
const useSessionAssessment = ({ user, sessionId, activeSession, messages, mode, sendMessageWithAI }) => {
  const [showAssessment, setShowAssessment] = useState(false);
  const checkedRef = useRef(false);

  // Run once after session + user are both ready
  useEffect(() => {
    if (!user || !sessionId || sessionId === 'new' || !activeSession) return;
    if (checkedRef.current) return;
    checkedRef.current = true;

    const check = async () => {
      try {
        const context = await getSessionContext(sessionId, user.$id);
        // Only show for brand-new sessions (no prior context, no messages yet)
        if (!context && messages.length === 0) {
          setShowAssessment(true);
        }
      } catch (err) {
        console.error('[useSessionAssessment] Failed to check assessment:', err);
      }
    };

    check();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, sessionId, activeSession]);

  const handleAssessmentComplete = async (responses) => {
    try {
      await saveSessionContext(sessionId, user.$id, mode, responses);
      setShowAssessment(false);

      // Send a personalised opening message so the AI knows the student's profile
      const level = responses.currentLevel || 'beginner';
      const goal = responses.learningGoal || '';
      const style = responses.preferredStyle || '';
      const time = responses.timeAvailable || 'flexible';

      const levelLabel = {
        complete_beginner: 'a complete beginner',
        beginner: 'a beginner who knows the basics',
        intermediate: 'at an intermediate level',
        advanced: 'at an advanced level',
      }[level] || 'a learner';

      const opening =
        `[STUDENT PROFILE CONFIRMED]\n` +
        `Knowledge level: ${levelLabel}.\n` +
        `${goal ? `Learning goal: ${goal}.\n` : ''}` +
        `${style ? `Preferred style: ${style}.\n` : ''}` +
        `${time !== 'flexible' ? `Time available: ${time}.\n` : ''}` +
        `\nPlease greet the student, confirm you understand their profile, ` +
        `and ask what topic they would like to start with today.`;

      await sendMessageWithAI(opening);
    } catch (err) {
      console.error('[useSessionAssessment] Failed to save assessment:', err);
      setShowAssessment(false);
    }
  };

  const handleAssessmentSkip = async (responses) => {
    setShowAssessment(false);
    if (Object.keys(responses).length > 0) {
      try {
        await saveSessionContext(sessionId, user.$id, mode, responses);
      } catch (err) {
        console.error('[useSessionAssessment] Failed to save partial assessment:', err);
      }
    }
  };

  return { showAssessment, handleAssessmentComplete, handleAssessmentSkip };
};

export default useSessionAssessment;
