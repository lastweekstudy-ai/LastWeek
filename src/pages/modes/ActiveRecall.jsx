import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import useSessionWithLimits from '../../hooks/useSessionWithLimits';
import UsageLimitModal from '../../components/UsageLimitModal';
import useSessionAssessment from '../../hooks/useSessionAssessment';
import useSessionSummary from '../../hooks/useSessionSummary';
import usePerformanceTracking from '../../hooks/usePerformanceTracking';
import useMobileViewport from '../../hooks/useMobileViewport';
import ChatInterface from '../../components/ChatInterface';
import PDFLibrary from '../../components/PDFLibrary';
import SessionAssessment from '../../components/SessionAssessment';
import Flashcard from '../../components/Flashcard';
import ConfidenceRater from '../../components/ConfidenceRater';
import { createFlashcard, updateFlashcard } from '../../appwrite/database';
import { upsertStudySchedule } from '../../appwrite/studySchedule';
import { getNextReviewDate } from '../../utils/spacedRepetition';
import { 
  ActiveRecallIcon, 
  CheckIcon,
  BookIcon,
  ArrowRightIcon
} from '../../components/Icons';
import '../../styles/ChatInterface.css';
import '../../styles/Flashcard.css';

const ActiveRecall = () => {
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

  const [currentMode, setCurrentMode] = useState('quiz');
  const [currentFlashcard, setCurrentFlashcard] = useState(null);
  const [showConfidenceRater, setShowConfidenceRater] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pdfLibraryOpen, setPdfLibraryOpen] = useState(false);
  const [scheduleError, setScheduleError] = useState(null);
  
  // Mobile viewport handling
  const { isMobile } = useMobileViewport();

  const { showAssessment, handleAssessmentComplete, handleAssessmentSkip } = useSessionAssessment({
    user, sessionId, activeSession, messages, mode: 'active_recall', sendMessageWithAI,
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
      const messageForAI = aiContextMessage || `[${currentMode.toUpperCase()} MODE] ${userMessage}`;
      await sendMessageWithAI(messageForAI, null, userMessage, fileAttachment || undefined);
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleModeChange = (newMode) => {
    setCurrentMode(newMode);
    setShowConfidenceRater(false);
    
    // Send mode change message to AI
    const modeMessages = {
      quiz: "Switch to Reverse Quiz mode. Ask me to explain a concept and grade my response.",
      flashcard: "Switch to Flashcard mode. Create question-answer pairs for me to practice.",
      scenario: "Switch to Scenario mode. Give me realistic case studies to solve."
    };
    
    handleSendMessage(modeMessages[newMode]);
  };

  const handleCreateFlashcard = async (front, back) => {
    if (!activeSession || !user) return;
    
    try {
      const flashcard = await createFlashcard(
        user.$id,
        activeSession.$id,
        front,
        back
      );
      setCurrentFlashcard(flashcard);
    } catch (err) {
      console.error('Failed to create flashcard:', err);
      alert('Failed to create flashcard: ' + err.message);
    }
  };

  const handleFlashcardRating = async (confidence) => {
    if (!currentFlashcard) return;
    
    try {
      const nextReviewDate = getNextReviewDate(confidence);
      await updateFlashcard(currentFlashcard.$id, confidence, nextReviewDate);
      
      setCurrentFlashcard(null);
      setShowConfidenceRater(false);
      
      // Ask for next question
      handleSendMessage("Ready for the next question!");
    } catch (err) {
      console.error('Failed to update flashcard:', err);
      alert('Failed to update flashcard: ' + err.message);
    }
  };

  const handleConfidenceRating = async (confidence) => {
    // Derive topic from last assistant message, fall back to session subject
    const lastAssistantMsg = [...messages].reverse().find(m => m.role === 'assistant');
    const topic = (lastAssistantMsg?.content?.trim().slice(0, 80)) || activeSession?.subject || '';

    // Call upsertStudySchedule and handle errors gracefully
    try {
      await upsertStudySchedule(user.$id, activeSession.$id, activeSession.subject, topic, confidence);
      setScheduleError(null);
    } catch (err) {
      console.error('Failed to upsert study schedule:', err);
      setScheduleError('Could not save review schedule. Your session continues normally.');
      setTimeout(() => setScheduleError(null), 5000);
    }

    setShowConfidenceRater(false);
    handleSendMessage(`My confidence level: ${confidence} (1=hard, 2=okay, 3=easy). Ready for the next question!`);
  };

  const handleSwitchMode = async (newMode) => {
    try {
      await switchMode(newMode);
      // Session ID is unchanged — no navigation needed
    } catch (err) {
      console.error('Failed to switch mode:', err);
    }
  };

  const extractFlashcardFromMessage = (message) => {
    // Simple pattern matching for flashcard format
    const flashcardPattern = /Q:\s*(.*?)\s*A:\s*(.*?)(?=\n|$)/gi;
    const match = flashcardPattern.exec(message);
    
    if (match) {
      return {
        front: match[1].trim(),
        back: match[2].trim()
      };
    }
    return null;
  };

  // Check if the last AI message contains a flashcard
  const lastAiMessage = messages.filter(m => m.role === 'assistant').pop();
  const flashcardData = lastAiMessage ? extractFlashcardFromMessage(lastAiMessage.content) : null;

  return (
    <div className="mode-page active-recall">
      {showAssessment && (
        <SessionAssessment
          mode="active_recall"
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
          
          {flashcardData && currentMode === 'flashcard' && activeSession && (
            <div className="flashcard-section">
              <Flashcard
                front={flashcardData.front}
                back={flashcardData.back}
                onRate={handleFlashcardRating}
              />
            </div>
          )}
          
          <ChatInterface
            messages={messages}
            onSend={handleSendMessage}
            isLoading={isLoading || !activeSession}
            isStreaming={isStreaming}
            isAnalysing={isAnalysing}
            mode="active_recall"
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
          
          {showConfidenceRater && activeSession && (
            <div className="confidence-section">
              <ConfidenceRater
                onRate={handleConfidenceRating}
                disabled={isLoading}
              />
            </div>
          )}
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
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => handleSendMessage("Quiz me on what we've covered so far")}
                disabled={isLoading || !activeSession}
              >
                🧠 Open Quiz
              </button>
            </div>
          </div>

          <div className="sidebar-section">
            <h3>Recall Modes</h3>
            <div className="quick-actions">
              <button
                className={`btn ${currentMode === 'quiz' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                onClick={() => handleModeChange('quiz')}
              >
                Reverse Quiz
              </button>
              <button
                className={`btn ${currentMode === 'flashcard' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                onClick={() => handleModeChange('flashcard')}
              >
                Flashcards
              </button>
              <button
                className={`btn ${currentMode === 'scenario' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                onClick={() => handleModeChange('scenario')}
              >
                Scenario Mode
              </button>
            </div>
          </div>

          <div className="sidebar-section">
            <h3>Current Mode: {currentMode.charAt(0).toUpperCase() + currentMode.slice(1)}</h3>
            <div className="mode-description">
              {currentMode === 'quiz' && (
                <p>The AI will ask you to explain concepts. You'll get graded feedback on your responses.</p>
              )}
              {currentMode === 'flashcard' && (
                <p>Practice with question-answer pairs. Rate your confidence to improve spaced repetition.</p>
              )}
              {currentMode === 'scenario' && (
                <p>Solve realistic case studies that test your ability to apply knowledge.</p>
              )}
            </div>
          </div>

          <div className="sidebar-section">
            <h3>Quick Actions</h3>
            <div className="quick-actions">
              <button 
                className="btn btn-secondary btn-sm"
                onClick={() => handleSendMessage("Give me a harder question")}
              >
                Harder Question
              </button>
              <button 
                className="btn btn-secondary btn-sm"
                onClick={() => handleSendMessage("Explain the answer in more detail")}
              >
                More Detail
              </button>
              <button 
                className="btn btn-secondary btn-sm"
                onClick={() => setShowConfidenceRater(true)}
              >
                Rate Confidence
              </button>
            </div>
          </div>

          <div className="sidebar-section">
            <h3>Active Recall Tips</h3>
            <div className="tips-list">
              <div className="tip-item">
                <CheckIcon size={16} /> Try to answer before looking at solutions
              </div>
              <div className="tip-item">
                <BookIcon size={16} /> Explain concepts in your own words
              </div>
              <div className="tip-item">
                <ArrowRightIcon size={16} /> Review difficult cards more frequently
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
          mode="active_recall"
          subject={activeSession.subject || 'General'}
        />
      )}

      {scheduleError && (
        <div className="schedule-error-toast" style={{
          position: 'fixed', bottom: '20px', right: '20px', zIndex: 1000,
          background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '8px',
          padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '8px',
          maxWidth: '360px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}>
          <span style={{ flex: 1, fontSize: '0.875rem', color: '#991b1b' }}>{scheduleError}</span>
          <button onClick={() => setScheduleError(null)} style={{
            background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: '#991b1b'
          }}>✕</button>
        </div>
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

export default ActiveRecall;