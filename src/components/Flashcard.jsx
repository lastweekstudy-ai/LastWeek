import React, { useState } from 'react';

const Flashcard = ({ front, back, onRate, isReview = false }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleRate = (confidence) => {
    onRate(confidence);
    setIsFlipped(false);
  };

  return (
    <div className="flashcard-container">
      <div className={`flashcard ${isFlipped ? 'flipped' : ''}`} onClick={handleFlip}>
        <div className="flashcard-front">
          <div className="flashcard-content">
            <h4>Question</h4>
            <p>{front}</p>
          </div>
          <div className="flashcard-hint">
            Click to reveal answer
          </div>
        </div>
        
        <div className="flashcard-back">
          <div className="flashcard-content">
            <h4>Answer</h4>
            <p>{back}</p>
          </div>
        </div>
      </div>

      {isFlipped && (
        <div className="confidence-rater fade-in">
          <p className="text-sm text-muted mb-sm">How well did you know this?</p>
          <div className="confidence-buttons">
            <button
              className="btn confidence-btn hard"
              onClick={() => handleRate(1)}
            >
              😰 Hard
            </button>
            <button
              className="btn confidence-btn okay"
              onClick={() => handleRate(2)}
            >
              😐 Okay
            </button>
            <button
              className="btn confidence-btn easy"
              onClick={() => handleRate(3)}
            >
              😊 Easy
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Flashcard;