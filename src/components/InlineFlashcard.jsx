import React, { useState, useRef, useEffect } from 'react';
import EnhancedMessageFormatter from './EnhancedMessageFormatter';
import '../styles/Flashcard.css';

/**
 * InlineFlashcard — a flip card rendered directly inside a chat message.
 *
 * Props:
 *   front    {string}   Markdown/math content for the front face
 *   back     {string}   Markdown/math content for the back face
 *   onRate   {function} Called with 1 | 2 | 3 when user rates confidence
 */
const InlineFlashcard = ({ front, back, onRate }) => {
  const [flipped, setFlipped] = useState(false);
  const [rated, setRated]     = useState(false);
  const frontRef = useRef(null);
  const backRef  = useRef(null);
  const [sceneHeight, setSceneHeight] = useState('auto');

  // After render, set the scene height to the taller of the two faces
  // so the absolutely-positioned back face doesn't collapse the container.
  useEffect(() => {
    const measure = () => {
      const fh = frontRef.current?.scrollHeight || 0;
      const bh = backRef.current?.scrollHeight  || 0;
      setSceneHeight(Math.max(fh, bh, 120) + 'px');
    };
    measure();
    // Re-measure if fonts / KaTeX load late
    const t = setTimeout(measure, 400);
    return () => clearTimeout(t);
  }, [front, back]);

  const handleRate = (score) => {
    setRated(true);
    onRate?.(score);
  };

  return (
    <div className="inline-flashcard-wrapper">
      <div className="inline-flashcard-container">
        {/* Flip scene */}
        <div
          className="inline-flashcard-scene"
          style={{ height: sceneHeight }}
          onClick={() => !rated && setFlipped(f => !f)}
          role="button"
          aria-label={flipped ? 'Click to see question' : 'Click to reveal answer'}
          tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && !rated && setFlipped(f => !f)}
        >
          <div className={`inline-flashcard-card${flipped ? ' flipped' : ''}`}>
            {/* Front */}
            <div className="inline-flashcard-face front" ref={frontRef}>
              <div className="inline-flashcard-label">Question</div>
              <div className="inline-flashcard-body">
                <EnhancedMessageFormatter content={front} />
              </div>
              <div className="inline-flashcard-hint">Click to reveal answer ↓</div>
            </div>

            {/* Back */}
            <div className="inline-flashcard-face back" ref={backRef}>
              <div className="inline-flashcard-label">Answer</div>
              <div className="inline-flashcard-body">
                <EnhancedMessageFormatter content={back} />
              </div>
            </div>
          </div>
        </div>

        {/* Confidence buttons — appear after flip */}
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
              ✓ Response recorded
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InlineFlashcard;
