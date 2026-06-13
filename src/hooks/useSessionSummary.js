import { useEffect, useRef } from 'react';

/**
 * Generates and saves a session summary when the component unmounts
 * (i.e. when the user navigates away from a session page).
 * Only fires if there are at least 4 messages in the session.
 */
const useSessionSummary = ({ messages, generateAndSaveSummary }) => {
  const messagesRef = useRef(messages);
  const generateRef = useRef(generateAndSaveSummary);
  const lastRollingSummaryCountRef = useRef(0);

  // Keep refs current without re-running the effect
  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { generateRef.current = generateAndSaveSummary; }, [generateAndSaveSummary]);

  useEffect(() => {
    const messageCount = messages.length;
    if (messageCount < 12) return;
    if (messageCount % 12 !== 0) return;
    if (lastRollingSummaryCountRef.current === messageCount) return;

    lastRollingSummaryCountRef.current = messageCount;
    generateRef.current?.();
  }, [messages.length]);

  useEffect(() => {
    return () => {
      // On unmount — generate summary if session has enough content
      if (messagesRef.current.length >= 4) {
        generateRef.current?.();
      }
    };
  }, []); // empty deps — runs only on unmount
};

export default useSessionSummary;
