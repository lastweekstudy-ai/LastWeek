import React from 'react';

const getThinkingLabel = (message) => {
  if (/analys/i.test(message)) return 'Reading the material';
  if (/generat/i.test(message)) return 'Building the answer';
  return 'Thinking through the next step';
};

const AITypingAnimation = ({ message = 'Thinking...' }) => {
  return (
    <div className="ai-thinking-card" role="status" aria-live="polite">
      <div className="ai-thinking-orbit" aria-hidden="true">
        <span className="ai-thinking-core" />
        <span className="ai-thinking-ring ai-thinking-ring-a" />
        <span className="ai-thinking-ring ai-thinking-ring-b" />
      </div>

      <div className="ai-thinking-copy">
        <span className="ai-thinking-kicker">LastWeek AI</span>
        <strong>{getThinkingLabel(message)}</strong>
        <span>{message}</span>
      </div>

      <div className="ai-thinking-wave" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>
    </div>
  );
};

export default AITypingAnimation;
