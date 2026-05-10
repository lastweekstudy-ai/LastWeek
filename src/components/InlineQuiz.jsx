import React, { useState } from 'react';
import EnhancedMessageFormatter from './EnhancedMessageFormatter';
import '../styles/InlineQuiz.css';

/**
 * InlineQuiz — renders a single MCQ question with clickable options.
 *
 * Props:
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
  questionNumber,
  totalQuestions,
  questionText,
  options,
  explanation,
  onAnswer,
  isLast,
  sessionScore,
}) => {
  const [selected, setSelected]   = useState(null); // label string
  const [revealed, setRevealed]   = useState(false);

  const handleSelect = (opt) => {
    if (revealed) return;
    setSelected(opt.label);
    setRevealed(true);
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
