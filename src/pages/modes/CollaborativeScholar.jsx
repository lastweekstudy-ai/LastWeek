import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import useSessionWithLimits from '../../hooks/useSessionWithLimits';
import UsageLimitModal from '../../components/UsageLimitModal';
import useSessionAssessment from '../../hooks/useSessionAssessment';
import useSessionSummary from '../../hooks/useSessionSummary';
import usePerformanceTracking from '../../hooks/usePerformanceTracking';
import ChatInterface from '../../components/ChatInterface';
import PDFLibrary from '../../components/PDFLibrary';
import SessionAssessment from '../../components/SessionAssessment';
import { 
  CollaborativeScholarIcon, 
  UserIcon,
  BookIcon,
  CheckIcon,
  ArrowRightIcon
} from '../../components/Icons';

const CollaborativeScholar = () => {
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
    switchMode,
    generateAndSaveSummary,
    limitBlocked,
    clearLimitBlock,
    usageLimits,
  } = useSessionWithLimits();

  const [selectedPersona, setSelectedPersona] = useState('Einstein');
  const [currentMode, setCurrentMode] = useState('talk');
  const [essayContent, setEssayContent] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pdfLibraryOpen, setPdfLibraryOpen] = useState(false);

  const { showAssessment, handleAssessmentComplete, handleAssessmentSkip } = useSessionAssessment({
    user, sessionId, activeSession, messages, mode: 'collaborative_scholar', sendMessageWithAI,
  });

  useSessionSummary({ messages, generateAndSaveSummary });

  const { handleFlashcardRate, handleMCQAnswer } = usePerformanceTracking({
    userId: user?.$id,
    sessionId: activeSession?.$id,
    subject: activeSession?.subject,
    activeSession,
  });

  const handlePDFUploaded = useCallback((fileData) => {
    setPdfLibraryOpen(true);
  }, []);

  const personas = [
    'Einstein', 'Turing', 'Curie', 'Newton', 'Aristotle',
    'Darwin', 'Feynman', 'Tesla', 'Keynes', 'Voltaire'
  ];

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
      await sendMessageWithAI(messageForAI, selectedPersona, userMessage, fileAttachment || undefined);
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handlePersonaChange = (persona) => {
    setSelectedPersona(persona);
    const message = `Switch to speaking as ${persona}. Introduce yourself and your expertise in ${activeSession?.subject}.`;
    handleSendMessage(message);
  };

  const handleModeChange = (mode) => {
    setCurrentMode(mode);
    
    const modeMessages = {
      talk: `Continue as ${selectedPersona}. Answer my questions about ${activeSession?.subject} in your historical voice.`,
      debate: `Switch to DEBATE MODE as ${selectedPersona}. Take a strong opposing stance and challenge my ideas with evidence.`,
      review: `Switch to PEER REVIEW MODE. Act as a Teaching Assistant and provide structured feedback on essays and arguments.`
    };
    
    handleSendMessage(modeMessages[mode]);
  };

  const handleEssayReview = async () => {
    if (!essayContent.trim()) return;
    
    try {
      const message = `Please review this essay/argument and provide structured feedback with Strengths, Weaknesses, Suggestions, and a Grade:\n\n${essayContent}`;
      await handleSendMessage(message);
      setEssayContent('');
    } catch (err) {
      console.error('Failed to review essay:', err);
      alert('Failed to review essay: ' + err.message);
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
    <div className={`mode-page collaborative-scholar ${sidebarOpen ? 'sidebar-visible' : ''}`}>
      {showAssessment && (
        <SessionAssessment
          mode="collaborative_scholar"
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
            mode="collaborative_scholar"
            userId={user?.$id}
            sessionId={activeSession?.$id}
            subject={activeSession?.subject || 'General'}
            onSidebarToggle={() => setSidebarOpen((open) => !open)}
            onResourcesToggle={() => setPdfLibraryOpen(!pdfLibraryOpen)}
            sidebarOpen={sidebarOpen}
            onPDFUploaded={handlePDFUploaded}
            onFlashcardRate={handleFlashcardRate}
            onMCQAnswer={handleMCQAnswer}
          />
        </div>

        {sidebarOpen && (
          <button
            type="button"
            className="mode-sidebar-backdrop"
            aria-label="Close sidebar"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <div className={`mode-sidebar ${sidebarOpen ? 'open' : ''}`}>
          <button 
            className="sidebar-close"
            onClick={() => setSidebarOpen(false)}
            title="Close sidebar"
          >
            ✕
          </button>

          <div className="sidebar-section">
            <h3>Quick Study</h3>
            <div className="quick-actions">
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => handleSendMessage("Quiz me on what we've covered so far")}
                disabled={isLoading || !activeSession}
              >
                🧠 Quiz me
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => handleSendMessage("Create a flashcard for the last concept")}
                disabled={isLoading || !activeSession}
              >
                🃏 Flashcard
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => handleSendMessage("Give me 3 MCQs on this topic")}
                disabled={isLoading || !activeSession}
              >
                ✅ MCQ Quiz
              </button>
            </div>
          </div>

          <div className="sidebar-section">
            <h3>Persona & Mode</h3>
            <div className="persona-selector" style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.875rem' }}>Speaking as:</label>
              <select 
                value={selectedPersona}
                onChange={(e) => handlePersonaChange(e.target.value)}
                className="form-select"
                style={{ width: '100%' }}
              >
                {personas.map(persona => (
                  <option key={persona} value={persona}>{persona}</option>
                ))}
              </select>
            </div>

            <div className="quick-actions">
              <button
                className={`btn ${currentMode === 'talk' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                onClick={() => handleModeChange('talk')}
              >
                Talk
              </button>
              <button
                className={`btn ${currentMode === 'debate' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                onClick={() => handleModeChange('debate')}
              >
                Debate
              </button>
              <button
                className={`btn ${currentMode === 'review' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                onClick={() => handleModeChange('review')}
              >
                Review
              </button>
            </div>
          </div>

          <div className="sidebar-section">
            <h3>Current Setup</h3>
            <div className="current-setup">
              <div className="setup-item">
                <strong>Persona:</strong> {selectedPersona}
              </div>
              <div className="setup-item">
                <strong>Mode:</strong> {currentMode.charAt(0).toUpperCase() + currentMode.slice(1)}
              </div>
            </div>
          </div>

          {currentMode === 'review' && (
            <div className="sidebar-section">
              <h3>Submit Essay</h3>
              <textarea
                value={essayContent}
                onChange={(e) => setEssayContent(e.target.value)}
                placeholder="Paste your essay or argument here for review..."
                className="form-textarea essay-input"
                rows="8"
              />
              <button
                className="btn btn-primary btn-sm"
                onClick={handleEssayReview}
                disabled={!essayContent.trim() || isLoading}
              >
                Submit for Review
              </button>
            </div>
          )}

          <div className="sidebar-section">
            <h3>Quick Prompts</h3>
            <div className="quick-actions">
              <button 
                className="btn btn-secondary btn-sm"
                onClick={() => handleSendMessage("What would you have done differently?")}
              >
                Different Approach?
              </button>
              <button 
                className="btn btn-secondary btn-sm"
                onClick={() => handleSendMessage("What was your biggest mistake or regret?")}
              >
                Biggest Regret?
              </button>
              <button 
                className="btn btn-secondary btn-sm"
                onClick={() => handleSendMessage("How does this relate to your famous work?")}
              >
                Connect to Work
              </button>
            </div>
          </div>

          <div className="sidebar-section">
            <h3>Scholar Tips</h3>
            <div className="tips-list">
              <div className="tip-item">
                <UserIcon size={16} /> Each persona has unique perspectives
              </div>
              <div className="tip-item">
                <ArrowRightIcon size={16} /> Debate mode challenges your thinking
              </div>
              <div className="tip-item">
                <BookIcon size={16} /> Get structured essay feedback
              </div>
              <div className="tip-item">
                <CheckIcon size={16} /> Ask about historical context
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
          mode="collaborative_scholar"
          subject={activeSession.subject || 'General'}
        />
      )}

      <UsageLimitModal
        isOpen={!!limitBlocked}
        onClose={clearLimitBlock}
        action={limitBlocked?.action}
        current={limitBlocked?.current}
        limit={limitBlocked?.limit}
        remaining={limitBlocked?.remaining}
        requested={limitBlocked?.requested}
        planName={limitBlocked?.planName}
      />
    </div>
  );
};

export default CollaborativeScholar;
