import React from 'react';
import '../styles/AITypingAnimation.css';

/**
 * AITypingAnimation - Enhanced loading animation for AI responses
 * Shows a more engaging "AI is thinking" animation with multiple visual effects
 */
const AITypingAnimation = ({ message = "Thinking..." }) => {
  return (
    <div className="ai-typing-container">
      {/* Animated dots */}
      <div className="ai-typing-dots">
        <span className="ai-dot"></span>
        <span className="ai-dot"></span>
        <span className="ai-dot"></span>
      </div>
      
      {/* Status text */}
      <div className="ai-typing-text">{message}</div>
      
      {/* Pulse effect */}
      <div className="ai-typing-pulse"></div>
    </div>
  );
};

export default AITypingAnimation;
