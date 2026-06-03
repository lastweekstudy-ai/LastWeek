import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import '../styles/ChatInterface.css';
import LoadingDots from './LoadingDots';
import AITypingAnimation from './AITypingAnimation';
import FileAttachment from './FileAttachment';
import QuickActions from './QuickActions';
import EnhancedMessageFormatter from './EnhancedMessageFormatter';
import MathKeyboard from './MathKeyboard';
import FlashcardCreateModal from './FlashcardCreateModal';
import useMobileViewport from '../hooks/useMobileViewport';
import { 
  MentalModelIcon, 
  ActiveRecallIcon, 
  FocusBreakdownIcon, 
  CollaborativeScholarIcon, 
  CreativeSynthesisIcon, 
  ChatIcon,
  AttachmentIcon,
  QuickActionIcon,
  CopyIcon,
  ExpandIcon
} from './Icons';

const ChatInterface = ({ 
  messages, 
  onSend, 
  isLoading, 
  isStreaming = false,
  isAnalysing = false,
  mode, 
  userId = null, 
  sessionId = null, 
  subject = 'General',
  onSidebarToggle = null,
  onResourcesToggle = null,
  sidebarOpen = false,
  insideStudyMode = false,
  onPDFUploaded = null,
  onFlashcardRate = null,  // callback(confidence, front, back)
  onMCQAnswer = null,      // callback(isCorrect, questionText)
}) => {
  const [input, setInput] = useState('');
  const [showAttachments, setShowAttachments] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [showMathKeyboard, setShowMathKeyboard] = useState(false);
  const [showFlashcardModal, setShowFlashcardModal] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [isUploadingPDF, setIsUploadingPDF] = useState(false); // NEW: track PDF upload state
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const textareaRef = useRef(null);
  const scrollTimeoutRef = useRef(null);
  
  // Mobile viewport handling
  const { isMobile, adjustForKeyboard, scrollIntoViewMobile } = useMobileViewport();

  // Optimized scroll with debouncing
  const scrollToBottom = useCallback(() => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, []);

  useEffect(() => {
    scrollToBottom();
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [messages.length, scrollToBottom]); // Only scroll when message count changes

  // Show scroll-to-bottom button when user scrolls up
  const handleMessagesScroll = useCallback(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollBtn(distanceFromBottom > 200);
  }, []);

  // Auto-resize textarea as user types
  const autoResizeTextarea = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 200) + 'px';
  }, []);

  // Optimized input change handler
  const handleInputChange = useCallback((e) => {
    setInput(e.target.value);
    autoResizeTextarea();
  }, [autoResizeTextarea]);

  // Mobile-optimized textarea focus handler
  const handleTextareaFocus = useCallback((e) => {
    if (isMobile && textareaRef.current) {
      adjustForKeyboard(textareaRef.current);
    }
  }, [isMobile, adjustForKeyboard]);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    if (input.trim() && !isLoading && !isStreaming) {
      const pdfQuery = input.match(/(?:in|from|about|of)\s+([a-zA-Z0-9_\-\.]+\.pdf)/i) || 
                       input.match(/📄([a-zA-Z0-9_\-\.]+\.pdf)/i) ||
                       input.match(/page\s+\d+/i);

      if (pdfQuery && !pendingFile && !insideStudyMode) {
        const pdfName = pdfQuery[1] || 'the PDF';
        const warningMessage = `To answer questions about ${pdfName}, please:
1. Click the 📚 Resources button
2. Open the PDF you want to study
3. Then ask your question in the split-screen chat

This ensures I have the complete PDF content with accurate page and line numbers.`;
        onSend(input.trim(), `[SYSTEM WARNING]\n${warningMessage}\n\nUser asked: ${input.trim()}`);
        setInput('');
        return;
      }
      
      if (pendingFile) {
        const userDisplayMessage = input.trim();
        const aiContextMessage = `${pendingFile.content}\n\nUser Question: ${input.trim()}`;
        onSend(userDisplayMessage, aiContextMessage, pendingFile);
        setPendingFile(null);
      } else {
        onSend(input.trim());
      }
      setInput('');
      setShowAttachments(false);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  }, [input, isLoading, pendingFile, onSend]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }, [handleSubmit]);

  const handleQuickAction = useCallback((prompt) => {
    if (!isLoading) {
      onSend(prompt);
      setShowQuickActions(false);
    }
  }, [isLoading, onSend]);

  const handleFileProcess = useCallback(async (fileData) => {
    // Check if it's a PDF
    const isPDF = fileData.type === 'application/pdf';
    
    if (isPDF) {
      setIsUploadingPDF(true);
    }
    
    setPendingFile(fileData);
    setShowAttachments(false);
    
    // If PDF and callback provided, automatically open PDF library after a short delay
    if (isPDF && onPDFUploaded) {
      setTimeout(() => {
        setIsUploadingPDF(false);
        onPDFUploaded(fileData);
      }, 500);
    } else {
      setIsUploadingPDF(false);
    }
    
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [onPDFUploaded]);

  // Insert a LaTeX symbol at the current cursor position in the textarea
  const handleMathInsert = useCallback((latex) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const before = input.slice(0, start);
    const after = input.slice(end);
    // Wrap in $ if the cursor isn't already inside a math context
    const inMath = (before.split('$').length - 1) % 2 === 1;
    const toInsert = inMath ? latex : `$${latex}$`;
    const newValue = before + toInsert + after;
    setInput(newValue);
    // Restore focus and move cursor inside the inserted snippet
    requestAnimationFrame(() => {
      ta.focus();
      const cursorPos = start + toInsert.length;
      ta.setSelectionRange(cursorPos, cursorPos);
    });
  }, [input]);

  const copyToClipboard = useCallback((text) => {
    navigator.clipboard.writeText(text);
  }, []);

  // Memoized message component to prevent re-renders
  const MessageItem = useMemo(() => React.memo(({ message, mode, onCopy, onFlashcardRate, onMCQAnswer }) => {
    // Parse message content to check for file attachment
    let messageText = message.content;
    let fileAttachment = null;
    
    try {
      const parsed = JSON.parse(message.content);
      if (parsed.text && parsed.file) {
        messageText = parsed.text;
        fileAttachment = parsed.file;
      }
    } catch (e) {
      // Not JSON, use as-is
      messageText = message.content;
    }
    
    // Format timestamp
    const formatTime = (timestamp) => {
      if (!timestamp) return '';
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);
      
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      
      // Show date and time for older messages
      return date.toLocaleString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    };
    
    return (
      <div
        className={`chat-message-improved ${message.role === 'user' ? 'user' : 'assistant'} slide-in`}
      >
        <div className="message-content-improved">
          {message.role === 'assistant' && (
            <div className="message-avatar">
              {getModeIcon(mode)}
            </div>
          )}
          <div className="message-bubble">
            {/* Show file attachment for user messages */}
            {message.role === 'user' && fileAttachment && (
              <div className="message-file-attachment">
                {fileAttachment.type?.startsWith('image/') && (fileAttachment.url || fileAttachment.fileUrl) ? (
                  <img 
                    src={fileAttachment.url || fileAttachment.fileUrl} 
                    alt={fileAttachment.name}
                    style={{ 
                      maxWidth: '300px', 
                      maxHeight: '200px', 
                      borderRadius: '8px',
                      marginBottom: '8px'
                    }}
                  />
                ) : (
                  <div className="file-badge" style={{ marginBottom: '8px' }}>
                    <span className="file-icon">
                      {fileAttachment.type === 'application/pdf' ? '📄' : 
                       fileAttachment.type?.startsWith('text/') ? '📝' : '📎'}
                    </span>
                    <span className="file-name">{fileAttachment.name}</span>
                  </div>
                )}
              </div>
            )}
            
            <div className="message-text-improved">
              {message.role === 'assistant' ? (
                <>
                  <EnhancedMessageFormatter
                    content={messageText}
                    messageId={message.$id}
                    onFlashcardRate={onFlashcardRate}
                    onMCQAnswer={onMCQAnswer}
                  />
                  {message.isStreaming && <span className="streaming-cursor" aria-hidden="true">▋</span>}
                </>
              ) : (
                <EnhancedMessageFormatter content={messageText} messageId={message.$id} />
              )}
            </div>
            
            {/* Timestamp */}
            <div className="message-timestamp">
              {formatTime(message.$createdAt || message.createdAt)}
            </div>
            
            {message.role === 'assistant' && (
              <div className="message-actions">
                <button
                  className="message-action-btn"
                  onClick={() => onCopy(messageText)}
                  title="Copy message"
                >
                  <CopyIcon size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }), [mode]);

  const getModeIcon = (mode) => {
    const iconProps = { size: 20, className: "mode-icon-svg" };
    
    switch (mode) {
      case 'mental_model':
        return <MentalModelIcon {...iconProps} />;
      case 'active_recall':
        return <ActiveRecallIcon {...iconProps} />;
      case 'focus_breakdown':
        return <FocusBreakdownIcon {...iconProps} />;
      case 'collaborative_scholar':
        return <CollaborativeScholarIcon {...iconProps} />;
      case 'creative_synthesis':
        return <CreativeSynthesisIcon {...iconProps} />;
      default:
        return <ChatIcon {...iconProps} />;
    }
  };

  return (
    <div className="chat-interface-improved">
      {/* Messages Area */}
      <div
        className="chat-messages-improved"
        ref={messagesContainerRef}
        onScroll={handleMessagesScroll}
      >
        {messages.length === 0 && (
          <div className="welcome-message">
            <div className="welcome-icon">{getModeIcon(mode)}</div>
            <h3>Ready to learn!</h3>
            <p>Start by asking a question, uploading a file, or using quick actions below.</p>
          </div>
        )}

        {messages.map((message, index) => (
          <MessageItem
            key={message.$id || `msg-${index}`}
            message={message}
            mode={mode}
            onCopy={copyToClipboard}
            onFlashcardRate={onFlashcardRate}
            onMCQAnswer={onMCQAnswer}
          />
        ))}
        
        {(isLoading || isAnalysing) && (
          <div className="chat-message-improved assistant slide-in">
            <div className="message-content-improved">
              <div className="message-avatar">
                {getModeIcon(mode)}
              </div>
              <div className="message-bubble">
                <div className="message-text-improved">
                  <AITypingAnimation 
                    message={isAnalysing ? "Analysing document..." : isStreaming ? "Generating response..." : "Thinking..."} 
                  />
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom button */}
      {showScrollBtn && (
        <button
          className="scroll-to-bottom-btn"
          onClick={scrollToBottom}
          title="Scroll to latest message"
          aria-label="Scroll to bottom"
        >
          ↓
        </button>
      )}

      {/* Input Area */}
      <div className="chat-input-area">
        {/* Quick Actions - always at bottom, always accessible */}
        {showQuickActions && (
          <div className="quick-actions-bar">
            <QuickActions 
              mode={mode} 
              onQuickAction={handleQuickAction}
              disabled={isLoading}
            />
            <button 
              className="close-quick-actions"
              onClick={() => setShowQuickActions(false)}
              title="Hide quick actions"
            >
              ✕
            </button>
          </div>
        )}
        {/* File Indicator - Show when file is attached */}
        {pendingFile && (
          <div className="file-indicator">
            <div className="file-indicator-content">
              {pendingFile.type?.startsWith('image/') && (pendingFile.fileUrl || pendingFile.url) ? (
                <div className="file-preview-image">
                  <img src={pendingFile.fileUrl || pendingFile.url} alt={pendingFile.name} style={{ maxHeight: '100px', maxWidth: '200px', borderRadius: '8px' }} />
                  <span className="file-name-small">{pendingFile.name}</span>
                </div>
              ) : (
                <>
                  <span className="file-icon">
                    {pendingFile.type === 'application/pdf' ? '📄' : 
                     pendingFile.type?.startsWith('text/') ? '📝' : '📎'}
                  </span>
                  <span className="file-name">{pendingFile.name}</span>
                  <span className="file-type-badge">
                    {pendingFile.type === 'application/pdf' ? 'PDF' :
                     pendingFile.type === 'text/html' ? 'HTML' :
                     pendingFile.type?.startsWith('text/') ? 'TEXT' : 'FILE'}
                  </span>
                </>
              )}
              <span className="file-status">✓ Ready</span>
              <button 
                className="remove-file-btn"
                onClick={() => setPendingFile(null)}
                title="Remove file"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Math Keyboard Panel */}
        {showMathKeyboard && (
          <MathKeyboard
            onInsert={handleMathInsert}
            onClose={() => setShowMathKeyboard(false)}
          />
        )}

        {/* File Attachment Section */}
        {showAttachments && !pendingFile && (
          <div className="attachment-section">
            <FileAttachment 
              onFileProcess={handleFileProcess}
              disabled={isLoading}
              userId={userId}
              sessionId={sessionId}
              studyMode={mode || 'mental_model'}
              subject={subject}
            />
          </div>
        )}

        {/* Input Form */}
        <form className="chat-input-form-improved" onSubmit={handleSubmit}>
          <div className="input-toolbar">
            {/* Action Buttons — slim icon+label style */}
            {onSidebarToggle && (
              <button
                type="button"
                className={`toolbar-btn ${sidebarOpen ? 'active' : ''}`}
                onClick={onSidebarToggle}
                title={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
              >
                {sidebarOpen ? '✕' : '☰'}
              </button>
            )}
            
            {onResourcesToggle && (
              <button
                type="button"
                className="toolbar-btn"
                onClick={onResourcesToggle}
                title="Study Resources"
              >
                📚 <span className="toolbar-btn-label">Library</span>
              </button>
            )}
            
            <button
              type="button"
              className={`toolbar-btn ${showAttachments ? 'active' : ''}`}
              onClick={() => setShowAttachments(!showAttachments)}
              disabled={isLoading || isUploadingPDF}
              title="Attach file"
            >
              <AttachmentIcon size={13} /> <span className="toolbar-btn-label">File</span>
            </button>

            <button
              type="button"
              className={`toolbar-btn ${showMathKeyboard ? 'math-active' : ''}`}
              onClick={() => setShowMathKeyboard(v => !v)}
              disabled={isLoading || isUploadingPDF}
              title="Math & science symbols"
            >
              ∑ <span className="toolbar-btn-label">Math</span>
            </button>

            <button
              type="button"
              className="toolbar-btn"
              onClick={() => setShowFlashcardModal(true)}
              disabled={isLoading || isUploadingPDF}
              title="Create flashcard"
            >
              🃏 <span className="toolbar-btn-label">Card</span>
            </button>
            
            {!showQuickActions && (
              <button
                type="button"
                className="toolbar-btn"
                onClick={() => setShowQuickActions(true)}
                disabled={isLoading || isUploadingPDF}
                title="Show quick actions"
              >
                <QuickActionIcon size={13} /> <span className="toolbar-btn-label">Actions</span>
              </button>
            )}
          </div>

          <div className="chat-input-container-improved">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onFocus={handleTextareaFocus}
              onKeyDown={handleKeyPress}
              placeholder={isUploadingPDF ? "Processing PDF..." : pendingFile ? "What would you like to learn from this file?" : "Type your message... (Shift+Enter for new line)"}
              className="chat-input-improved"
              disabled={isLoading || isStreaming || isUploadingPDF}
              autoComplete="off"
              spellCheck="true"
            />
            <button
              type="submit"
              className="chat-send-btn-improved"
              disabled={!input.trim() || isLoading || isStreaming || isUploadingPDF}
            >
              {isLoading ? (
                <LoadingDots size="sm" />
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                </svg>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Flashcard Create Modal */}
      <FlashcardCreateModal
        isOpen={showFlashcardModal}
        onClose={() => setShowFlashcardModal(false)}
        userId={userId}
        sessionId={sessionId}
        subject={subject}
        onSaved={() => {
          // Could show a toast here in future
        }}
      />
    </div>
  );
};

export default ChatInterface;