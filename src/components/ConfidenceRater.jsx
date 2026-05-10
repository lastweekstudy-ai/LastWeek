import React from 'react';

const ConfidenceRater = ({ onRate, disabled = false }) => {
  return (
    <div className="confidence-rater">
      <p className="text-sm text-muted mb-sm">Rate your confidence:</p>
      <div className="confidence-buttons">
        <button
          className="btn confidence-btn hard"
          onClick={() => onRate(1)}
          disabled={disabled}
        >
          1 - Hard
        </button>
        <button
          className="btn confidence-btn okay"
          onClick={() => onRate(2)}
          disabled={disabled}
        >
          2 - Okay
        </button>
        <button
          className="btn confidence-btn easy"
          onClick={() => onRate(3)}
          disabled={disabled}
        >
          3 - Easy
        </button>
      </div>
    </div>
  );
};

export default ConfidenceRater;