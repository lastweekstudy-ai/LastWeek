import React, { useState, useRef, useEffect } from 'react';
import { SendIcon, CloseIcon } from './Icons';

const FilePromptInput = ({ fileName, fileType, onSubmit, onCancel }) => {
  const [prompt, setPrompt] = useState('');
  const textareaRef = useRef(null);

  useEffect(() => {
    // Focus on textarea when component mounts
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (prompt.trim()) {
      onSubmit(prompt.trim());
      setPrompt('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const getFileIcon = () => {
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('image')) return '🖼️';
    if (fileType.includes('word')) return '📝';
    return '📎';
  };

  return (
    <div className="file-prompt-input">
      <div className="file-prompt-header">
        <div className="file-info">
          <span className="file-icon">{getFileIcon()}</span>
          <div className="file-details">
            <span className="file-name">{fileName}</span>
            <span className="file-status">File processed successfully</span>
          </div>
        </div>
        <button 
          className="close-btn" 
          onClick={onCancel}
          title="Cancel"
        >
          <CloseIcon size={16} />
        </button>
      </div>

      <form className="prompt-form" onSubmit={handleSubmit}>
        <div className="prompt-input-container">
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="What would you like to learn from this file? (e.g., 'Summarize the main concepts', 'Create study questions', 'Explain the key ideas')"
            className="prompt-textarea"
            rows="3"
          />
        </div>
        
        <div className="prompt-actions">
          <div className="prompt-hints">
            <span className="hint-text">Press Enter to send, Shift+Enter for new line</span>
          </div>
          <button
            type="submit"
            className="send-btn"
            disabled={!prompt.trim()}
          >
            <SendIcon size={16} />
            <span>Send</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default FilePromptInput;