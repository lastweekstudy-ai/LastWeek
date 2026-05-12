import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import useSession from '../../hooks/useSession';
import useSessionAssessment from '../../hooks/useSessionAssessment';
import useSessionSummary from '../../hooks/useSessionSummary';
import usePerformanceTracking from '../../hooks/usePerformanceTracking';
import useMobileViewport from '../../hooks/useMobileViewport';
import ChatInterface from '../../components/ChatInterface';
import PDFLibrary from '../../components/PDFLibrary';
import SessionAssessment from '../../components/SessionAssessment';
import { 
  MentalModelIcon, 
  BookIcon,
  ArrowRightIcon,
  FileIcon,
  CheckIcon
} from '../../components/Icons';
import '../../styles/ChatInterface.css';
import '../../styles/ModePage.css';

const MentalModel = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
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
    generateAndSaveSummary
  } = useSession();

  const [analogiesUsed, setAnalogiesUsed] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pdfLibraryOpen, setPdfLibraryOpen] = useState(false);
  
  // Mobile viewport handling
  const { isMobile } = useMobileViewport();

  const { showAssessment, handleAssessmentComplete, handleAssessmentSkip } = useSessionAssessment({
    user,
    sessionId,
    activeSession,
    messages,
    mode: 'mental_model',
    sendMessageWithAI,
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

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    // Don't reload if session is already loaded with messages
    if (sessionId && sessionId !== 'new' && (!activeSession || activeSession.$id !== sessionId)) {
      loadSession(sessionId).catch(error => {
        console.error('Failed to load session:', error);
        navigate('/dashboard');
      });
    }
  }, [user, sessionId, navigate, activeSession, loadSession, messages.length]);

  useEffect(() => {
    // Extract analogies from AI messages
    const aiMessages = messages.filter(msg => msg.role === 'assistant');
    const extractedAnalogies = [];
    
    aiMessages.forEach(msg => {
      // Simple analogy detection - look for common analogy patterns
      const analogyPatterns = [
        /like (.*?)[.!?]/gi,
        /similar to (.*?)[.!?]/gi,
        /think of it as (.*?)[.!?]/gi,
        /imagine (.*?)[.!?]/gi
      ];
      
      analogyPatterns.forEach(pattern => {
        const matches = msg.content.match(pattern);
        if (matches) {
          matches.forEach(match => {
            if (!extractedAnalogies.includes(match)) {
              extractedAnalogies.push(match);
            }
          });
        }
      });
    });
    
    setAnalogiesUsed(extractedAnalogies);
  }, [messages]);

  const handleSendMessage = async (userMessage, aiContextMessage = null, fileAttachment = null) => {
    try {
      const messageForAI = aiContextMessage || userMessage;
      await sendMessageWithAI(messageForAI, null, userMessage, fileAttachment || undefined);
    } catch (err) {
      console.error('[MentalModel] Failed to send message:', err);
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

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
      alert('Logout failed: ' + error.message);
    }
  };

  return (
    <div className="mode-page mental-model">
      {/* Show assessment overlay if needed */}
      {showAssessment && (
        <SessionAssessment
          mode="mental_model"
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
            mode="mental_model"
            userId={user?.$id}
            sessionId={activeSession?.$id}
            subject={activeSession?.subject || 'General'}
            onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
            onResourcesToggle={() => setPdfLibraryOpen(!pdfLibraryOpen)}
            sidebarOpen={sidebarOpen}
            onPDFUploaded={handlePDFUploaded}
            onFlashcardRate={handleFlashcardRate}
            onMCQAnswer={handleMCQAnswer}
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
            <h3>Analogies Used</h3>
            {analogiesUsed.length > 0 ? (
              <div className="analogies-list">
                {analogiesUsed.slice(0, 5).map((analogy, index) => (
                  <div key={index} className="analogy-item">
                    {analogy}
                  </div>
                ))}
                {analogiesUsed.length > 5 && (
                  <div className="analogy-item text-muted">
                    +{analogiesUsed.length - 5} more...
                  </div>
                )}
              </div>
            ) : (
              <p className="text-muted">Analogies will appear here as the AI uses them</p>
            )}
          </div>

          <div className="sidebar-section">
            <h3>Mental Model Tips</h3>
            <div className="tips-list">
              <div className="tip-item">
                <BookIcon size={16} /> Ask for different analogies if one doesn't click
              </div>
              <div className="tip-item">
                <ArrowRightIcon size={16} /> Request comparisons to things you know well
              </div>
              <div className="tip-item">
                <CheckIcon size={16} /> Be specific about what confuses you
              </div>
              <div className="tip-item">
                <FileIcon size={16} /> Upload diagrams for AI to explain with analogies
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
          mode="mental_model"
          subject={activeSession.subject || 'General'}
        />
      )}
    </div>
  );
};

export default MentalModel;