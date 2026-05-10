import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import useSession from '../../hooks/useSession';
import useSessionAssessment from '../../hooks/useSessionAssessment';
import ChatInterface from '../../components/ChatInterface';
import PDFLibrary from '../../components/PDFLibrary';
import SessionAssessment from '../../components/SessionAssessment';
import { 
  FocusBreakdownIcon, 
  BookIcon,
  ClockIcon,
  CheckIcon,
  ArrowRightIcon
} from '../../components/Icons';
import '../../styles/ChatInterface.css';

const FocusBreakdown = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    activeSession, 
    messages, 
    isLoading, 
    isStreaming,
    isAnalysing,
    error, 
    loadSession, 
    sendMessageWithAI,
    switchMode 
  } = useSession();

  const [pastedContent, setPastedContent] = useState('');
  const [showTldr, setShowTldr] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pdfLibraryOpen, setPdfLibraryOpen] = useState(false);

  const { showAssessment, handleAssessmentComplete, handleAssessmentSkip } = useSessionAssessment({
    user,
    sessionId,
    activeSession,
    messages,
    mode: 'focus_breakdown',
    sendMessageWithAI,
  });

  const handlePDFUploaded = useCallback((fileData) => {
    console.log('[FocusBreakdown] PDF uploaded:', fileData.name);
    setPdfLibraryOpen(true);
  }, []);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (sessionId && sessionId !== 'new' && (!activeSession || activeSession.$id !== sessionId)) {
      loadSession(sessionId).catch(error => {
        console.error('Failed to load session:', error);
        alert('Failed to load session: ' + error.message);
        navigate('/dashboard');
      });
    }
  }, [user, sessionId, navigate, activeSession, loadSession]);

  const handleSendMessage = async (userMessage, aiContextMessage = null, fileAttachment = null) => {
    try {
      const messageForAI = aiContextMessage || userMessage;
      await sendMessageWithAI(messageForAI, null, userMessage, fileAttachment || undefined);
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleContentBreakdown = async () => {
    if (!pastedContent.trim()) return;
    
    try {
      const message = `Please break down this content into 5-minute reading segments with 3-bullet summaries:\n\n${pastedContent}`;
      await handleSendMessage(message);
      setPastedContent('');
    } catch (err) {
      console.error('Failed to break down content:', err);
      alert('Failed to break down content: ' + err.message);
    }
  };

  const handlePrerequisites = async () => {
    try {
      const message = "What prerequisite concepts do I need to know before learning this topic?";
      await handleSendMessage(message);
    } catch (err) {
      console.error('Failed to get prerequisites:', err);
      alert('Failed to get prerequisites: ' + err.message);
    }
  };

  const handleTldr = async () => {
    try {
      const message = "TL;DR - Give me only the core definitions and axioms, no explanations";
      await handleSendMessage(message);
      setShowTldr(true);
    } catch (err) {
      console.error('Failed to get TL;DR:', err);
      alert('Failed to get TL;DR: ' + err.message);
    }
  };

  const handleSwitchMode = async (newMode) => {
    try {
      await switchMode(newMode);
      // Session ID is unchanged — no navigation needed
    } catch (err) {
      console.error('Failed to switch mode:', err);
    }
  };

  return (
    <div className="mode-page focus-breakdown">
      {showAssessment && (
        <SessionAssessment
          mode="focus_breakdown"
          onComplete={handleAssessmentComplete}
          onSkip={handleAssessmentSkip}
        />
      )}
      <div className="mode-content">
        <div className="chat-section">
          {!activeSession ? (
            <div className="loading-state" style={{ padding: '40px', textAlign: 'center' }}>
              <p>Loading session...</p>
            </div>
          ) : null}
          
          <ChatInterface
            messages={messages}
            onSend={handleSendMessage}
            isLoading={isLoading || !activeSession}
            isStreaming={isStreaming}
            isAnalysing={isAnalysing}
            mode="focus_breakdown"
            userId={user?.$id}
            sessionId={activeSession?.$id}
            subject={activeSession?.subject || 'General'}
            onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
            onResourcesToggle={() => setPdfLibraryOpen(!pdfLibraryOpen)}
            sidebarOpen={sidebarOpen}
            onPDFUploaded={handlePDFUploaded}
          />
        </div>

        <div className={`mode-sidebar ${sidebarOpen ? 'open' : ''}`}>
          <button 
            className="sidebar-close"
            onClick={() => setSidebarOpen(false)}
            title="Close sidebar"
          >
            ✕
          </button>

          <div className="sidebar-section">
            <h3>Paste Content</h3>
            <textarea
              value={pastedContent}
              onChange={(e) => setPastedContent(e.target.value)}
              placeholder="Paste article, chapter, or dense material here..."
              className="form-textarea content-input"
              rows="6"
            />
            <button
              className="btn btn-primary btn-sm"
              onClick={handleContentBreakdown}
              disabled={!pastedContent.trim() || isLoading}
            >
              Break Down Content
            </button>
          </div>

          <div className="sidebar-section">
            <h3>Quick Tools</h3>
            <div className="quick-actions">
              <button
                className="btn btn-secondary btn-sm"
                onClick={handlePrerequisites}
                disabled={isLoading}
              >
                <BookIcon size={16} /> Prerequisites
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={handleTldr}
                disabled={isLoading}
              >
                <ArrowRightIcon size={16} /> TL;DR Mode
              </button>
            </div>
          </div>

          <div className="sidebar-section">
            <h3>Breakdown Tips</h3>
            <div className="tips-list">
              <div className="tip-item">
                <BookIcon size={16} /> Paste large texts for automatic chunking
              </div>
              <div className="tip-item">
                <ClockIcon size={16} /> Each segment = 5 minutes of reading
              </div>
              <div className="tip-item">
                <CheckIcon size={16} /> Get 3-bullet summaries per chunk
              </div>
              <div className="tip-item">
                <ArrowRightIcon size={16} /> Ask for prerequisites before diving in
              </div>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {activeSession && (
        <PDFLibrary
          sessionId={activeSession.$id}
          userId={user?.$id}
          isOpen={pdfLibraryOpen}
          onClose={() => setPdfLibraryOpen(false)}
          messages={messages}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          mode="focus_breakdown"
          subject={activeSession.subject || 'General'}
        />
      )}
    </div>
  );
};

export default FocusBreakdown;