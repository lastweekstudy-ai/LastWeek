import React, { useState } from 'react';

const Flashcard = ({ front, back, onRate }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = () => {
    setIsFlipped((flipped) => !flipped);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleFlip();
    }
  };

  const handleRate = (confidence) => {
    if (onRate) {
      onRate(confidence);
    }
    setIsFlipped(false);
  };

  return (
    <div className="flashcard-container">
      <div
        className={`flashcard ${isFlipped ? 'flipped' : ''}`}
        onClick={handleFlip}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-pressed={isFlipped}
      >
        {!isFlipped ? (
          <div className="flashcard-front">
            <div className="flashcard-content">
              <h4>Question</h4>
              <p>{front}</p>
            </div>
            <div className="flashcard-hint">Click to reveal answer</div>
          </div>
        ) : (
          <div className="flashcard-back">
            <div className="flashcard-content">
              <h4>Answer</h4>
              <p>{back}</p>
            </div>
          </div>
        )}
      </div>

      {isFlipped && (
        <div className="confidence-rater fade-in">
          <p className="text-sm text-muted mb-sm">How well did you know this?</p>
          <div className="confidence-buttons">
            <button
              className="btn confidence-btn hard"
              onClick={() => handleRate(1)}
            >
              Need practice
            </button>
            <button
              className="btn confidence-btn okay"
              onClick={() => handleRate(2)}
            >
              Almost
            </button>
            <button
              className="btn confidence-btn easy"
              onClick={() => handleRate(3)}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Flashcard;
