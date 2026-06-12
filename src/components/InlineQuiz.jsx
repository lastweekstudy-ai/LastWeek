import React, { useState, useEffect } from 'react';
import EnhancedMessageFormatter from './EnhancedMessageFormatter';

/**
 * InlineQuiz — renders a single MCQ question with clickable options.
 *
 * Props:
 *   messageId       {string}   Unique ID of the parent message (for persistence)
 *   questionNumber  {number}   e.g. 1
 *   totalQuestions  {number}   e.g. 5
 *   questionText    {string}   markdown/math question body
 *   options         {Array}    [{ label: 'A', text: '...', isCorrect: bool }]
 *   explanation     {string}   shown after answering (optional)
 *   onAnswer        {function} called with { label, isCorrect } when user picks
 *   isLast          {bool}     true on the final question — triggers score display
 *   sessionScore    {object}   { correct, total } accumulated so far
 */
const InlineQuiz = ({
  messageId,
  questionNumber,
  totalQuestions,
  questionText,
  options,
  explanation,
  onAnswer,
  isLast,
  sessionScore,
}) => {
  // Build a stable localStorage key from messageId + question number
  const storageKey = messageId
    ? `mcq_answer_${messageId}_q${questionNumber}`
    : null;

  // Restore saved answer from localStorage on mount
  const getSavedAnswer = () => {
    if (!storageKey) return null;
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  };

  const savedAnswer = getSavedAnswer();

  const [selected, setSelected] = useState(savedAnswer?.label ?? null);
  const [revealed, setRevealed] = useState(savedAnswer !== null);

  // If we restored a saved answer, fire onAnswer so parent score is correct
  useEffect(() => {
    if (savedAnswer !== null) {
      onAnswer?.({ label: savedAnswer.label, isCorrect: savedAnswer.isCorrect, restored: true });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelect = (opt) => {
    if (revealed) return;
    setSelected(opt.label);
    setRevealed(true);
    // Persist to localStorage so answer survives page refresh
    if (storageKey) {
      try {
        localStorage.setItem(storageKey, JSON.stringify({ label: opt.label, isCorrect: opt.isCorrect }));
      } catch {
        // localStorage full or unavailable — non-fatal
      }
    }
    onAnswer?.({ label: opt.label, isCorrect: opt.isCorrect });
  };

  const correctOpt = options.find(o => o.isCorrect);

  return (
    <div className="iq-wrapper">
      {/* Header */}
      <div className="iq-header">
        <span className="iq-badge">MCQ</span>
        {totalQuestions > 1 && (
          <span className="iq-counter">Question {questionNumber} of {totalQuestions}</span>
        )}
      </div>

      {/* Question */}
      <div className="iq-question">
        <EnhancedMessageFormatter content={questionText} />
      </div>

      {/* Options */}
      <div className="iq-options">
        {options.map((opt) => {
          let state = '';
          if (revealed) {
            if (opt.isCorrect)                        state = 'correct';
            else if (opt.label === selected)          state = 'wrong';
            else                                      state = 'dim';
          }
          return (
            <button
              key={opt.label}
              className={`iq-option ${state}`}
              onClick={() => handleSelect(opt)}
              disabled={revealed}
            >
              <span className="iq-option-label">{opt.label}</span>
              <span className="iq-option-text">
                <EnhancedMessageFormatter content={opt.text} />
              </span>
              {revealed && opt.isCorrect && <span className="iq-tick">✓</span>}
              {revealed && opt.label === selected && !opt.isCorrect && <span className="iq-cross">✗</span>}
            </button>
          );
        })}
      </div>

      {/* Explanation */}
      {revealed && explanation && (
        <div className="iq-explanation">
          <span className="iq-explanation-label">Explanation</span>
          <EnhancedMessageFormatter content={explanation} />
        </div>
      )}

      {/* Final score */}
      {revealed && isLast && sessionScore && (
        <div className="iq-score">
          <div className="iq-score-inner">
            <span className="iq-score-number">
              {sessionScore.correct}/{sessionScore.total}
            </span>
            <span className="iq-score-label">
              {sessionScore.correct === sessionScore.total
                ? '🎉 Perfect score!'
                : sessionScore.correct >= sessionScore.total * 0.7
                ? '👍 Good job!'
                : '📚 Keep practising!'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default InlineQuiz;
