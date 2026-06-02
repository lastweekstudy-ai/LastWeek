import React from 'react';
import '../styles/OrientationPrompt.css';

const OrientationPrompt = ({ onDismiss }) => {
  return (
    <div className="orientation-prompt-overlay">
      <div className="orientation-prompt-content">
        <div className="orientation-icon">
          <svg viewBox="0 0 100 100" className="phone-icon">
            {/* Phone body */}
            <rect x="25" y="10" width="50" height="80" rx="5" ry="5" fill="#1a1a1a" stroke="var(--color-accent)" strokeWidth="2"/>
            {/* Screen */}
            <rect x="30" y="20" width="40" height="55" rx="2" ry="2" fill="#0a0a0a"/>
            {/* Home button */}
            <circle cx="50" cy="82" r="4" fill="#333"/>
            {/* Rotate arrow */}
            <path d="M 75 50 Q 90 50 90 35 L 85 40 M 90 35 L 95 40" stroke="var(--color-accent)" strokeWidth="3" fill="none" strokeLinecap="round"/>
          </svg>
        </div>
        
        <h2 className="orientation-title">Rotate Your Device</h2>
        
        <p className="orientation-message">
          For the best viewing experience, please rotate your device to landscape mode.
        </p>
        
        <div className="orientation-benefits">
          <div className="benefit-item">
            <span className="benefit-icon">📄</span>
            <span>Better document viewing</span>
          </div>
          <div className="benefit-item">
            <span className="benefit-icon">🎧</span>
            <span>Full audio controls</span>
          </div>
          <div className="benefit-item">
            <span className="benefit-icon">🖼️</span>
            <span>Larger image preview</span>
          </div>
        </div>
        
        <button className="orientation-dismiss-btn" onClick={onDismiss}>
          Continue in Portrait Mode
        </button>
        
        <p className="orientation-note">
          Note: Some features may be limited in portrait mode
        </p>
      </div>
    </div>
  );
};

export default OrientationPrompt;