import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import useSession from '../../hooks/useSession';
import ChatInterface from '../../components/ChatInterface';
import PDFLibrary from '../../components/PDFLibrary';
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
    switchMode 
  } = useSession();

  const [analogiesUsed, setAnalogiesUsed] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pdfLibraryOpen, setPdfLibraryOpen] = useState(false);

  // NEW: Handle PDF upload - automatically open PDF library
  const handlePDFUploaded = useCallback((fileData) => {
    console.log('[MentalModel] PDF uploaded:', fileData.name);
    // Automatically open PDF library after upload
    setPdfLibraryOpen(true);
  }, []);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    // Don't reload if session is already loaded with messages
    if (sessionId && sessionId !== 'new' && (!activeSession || activeSession.$id !== sessionId)) {
      console.log('MentalModel: Loading session', sessionId);
      loadSession(sessionId).catch(error => {
        console.error('Failed to load session:', error);
        alert('Failed to load session: ' + error.message);
        navigate('/dashboard');
      });
    } else if (activeSession && messages.length > 0) {
      console.log('MentalModel: Session already loaded with', messages.length, 'messages');
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
    console.log('[MentalModel] handleSendMessage called:', {
      userMessage,
      hasAiContext: !!aiContextMessage,
      aiContextLength: aiContextMessage?.length || 0,
      hasFileAttachment: !!fileAttachment
    });

    try {
      const messageForAI = aiContextMessage || userMessage;
      console.log('[MentalModel] Calling sendMessageWithAI with message length:', messageForAI.length);
      await sendMessageWithAI(messageForAI, null, userMessage, fileAttachment || undefined);
      console.log('[MentalModel] sendMessageWithAI completed successfully');
    } catch (err) {
      console.error('[MentalModel] Failed to send message:', err);
      // Error is already set in sessionContext.error — it will display in the UI
      // No alert needed; the error banner at the bottom of the page will show it
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