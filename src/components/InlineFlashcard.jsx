import React, { useState } from 'react';
import EnhancedMessageFormatter from './EnhancedMessageFormatter';

/**
 * InlineFlashcard — a flip card rendered directly inside a chat message.
 *
 * Props:
 *   front    {string}   Markdown/math content for the front face
 *   back     {string}   Markdown/math content for the back face
 *   onRate   {function} Called with (score: 1|2|3, front: string, back: string)
 *   saved    {bool}     If true, shows "Saved ✓" badge (card already in library)
 */
const InlineFlashcard = ({ front, back, onRate, saved = false }) => {
  const [flipped, setFlipped] = useState(false);
  const [rated, setRated] = useState(false);

  const handleRate = (score) => {
    setRated(true);
    // Pass front and back content so the parent can save the card with correct content
    onRate?.(score, front, back);
  };

  return (
    <div className="inline-flashcard-wrapper">
      <div className="inline-flashcard-container">
        <div
          className={`inline-flashcard-scene${flipped ? ' is-flipped' : ''}`}
          onClick={() => !rated && setFlipped(f => !f)}
          role="button"
          aria-label={flipped ? 'Click to see question' : 'Click to reveal answer'}
          tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && !rated && setFlipped(f => !f)}
        >
          <div className="inline-flashcard-card">
            {!flipped ? (
            <div className="inline-flashcard-face front">
              <div className="inline-flashcard-label">Question</div>
              <div className="inline-flashcard-body">
                <EnhancedMessageFormatter content={front} />
              </div>
              <div className="inline-flashcard-hint">Click to reveal answer</div>
            </div>
            ) : (
            <div className="inline-flashcard-face back">
              <div className="inline-flashcard-label">Answer</div>
              <div className="inline-flashcard-body">
                <EnhancedMessageFormatter content={back} />
              </div>
            </div>
            )}
          </div>
        </div>

        {flipped && !rated && (
          <div className="inline-flashcard-confidence">
            <p>How confident are you?</p>
            <div className="inline-confidence-buttons">
              <button className="inline-confidence-btn hard" onClick={() => handleRate(1)}>
                😰 Need more practice
              </button>
              <button className="inline-confidence-btn okay" onClick={() => handleRate(2)}>
                😐 Almost got it
              </button>
              <button className="inline-confidence-btn easy" onClick={() => handleRate(3)}>
                😊 Got it
              </button>
            </div>
          </div>
        )}

        {rated && (
          <div className="inline-flashcard-confidence">
            <p style={{ color: 'var(--color-success, #10b981)', fontWeight: 600 }}>
              ✓ Saved to your flashcard library
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InlineFlashcard;
