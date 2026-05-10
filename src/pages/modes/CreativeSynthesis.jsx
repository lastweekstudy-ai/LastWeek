import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import useSession from '../../hooks/useSession';
import ChatInterface from '../../components/ChatInterface';
import PDFLibrary from '../../components/PDFLibrary';
import { 
  CreativeSynthesisIcon, 
  BookIcon,
  CheckIcon,
  ArrowRightIcon,
  PlusIcon
} from '../../components/Icons';
import '../../styles/ChatInterface.css';

const CreativeSynthesis = () => {
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

  const [currentMode, setCurrentMode] = useState('mindmap'); // mindmap, storyteller, projects
  const [userNotes, setUserNotes] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pdfLibraryOpen, setPdfLibraryOpen] = useState(false);

  const handlePDFUploaded = useCallback((fileData) => {
    console.log('[CreativeSynthesis] PDF uploaded:', fileData.name);
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

  const handleModeChange = (mode) => {
    setCurrentMode(mode);
    
    const modeMessages = {
      mindmap: "Switch to MIND MAP mode. Take concepts and structure them as a hierarchical text-based mind map.",
      storyteller: "Switch to STORYTELLER mode. Turn facts and concepts into dramatic narratives with characters and plot twists.",
      projects: "Switch to PROJECT CREATOR mode. Suggest real-world projects to prove mastery of concepts."
    };
    
    handleSendMessage(modeMessages[mode]);
  };

  const handleNotesToMindMap = async () => {
    if (!userNotes.trim()) return;
    
    try {
      const message = `Create a hierarchical mind map from these notes:\n\n${userNotes}`;
      await handleSendMessage(message);
      setUserNotes('');
    } catch (err) {
      console.error('Failed to create mind map:', err);
      alert('Failed to create mind map: ' + err.message);
    }
  };

  const handleCreateStory = async () => {
    try {
      const message = `Turn the concepts we've discussed into a dramatic story with characters, conflict, and plot twists.`;
      await handleSendMessage(message);
    } catch (err) {
      console.error('Failed to create story:', err);
      alert('Failed to create story: ' + err.message);
    }
  };

  const handleGenerateProjects = async () => {
    try {
      const message = `Suggest 3 small real-world projects I can build to prove I've mastered these concepts.`;
      await handleSendMessage(message);
    } catch (err) {
      console.error('Failed to generate projects:', err);
      alert('Failed to generate projects: ' + err.message);
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

  const renderMindMapOutput = (content) => {
    // Simple mind map formatting for display
    const lines = content.split('\n');
    return lines.map((line, index) => {
      const indentLevel = (line.match(/^[\s-]*/)?.[0]?.length || 0) / 2;
      return (
        <div 
          key={index} 
          className="mindmap-line"
          style={{ marginLeft: `${indentLevel * 20}px` }}
        >
          {line.trim()}
        </div>
      );
    });
  };

  return (
    <div className="mode-page creative-synthesis">
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
            mode="creative_synthesis"
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
            <h3>Synthesis Modes</h3>
            <div className="quick-actions">
              <button
                className={`btn ${currentMode === 'mindmap' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                onClick={() => handleModeChange('mindmap')}
              >
                <BookIcon size={16} /> Mind Map
              </button>
              <button
                className={`btn ${currentMode === 'storyteller' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                onClick={() => handleModeChange('storyteller')}
              >
                <BookIcon size={16} /> Storyteller
              </button>
              <button
                className={`btn ${currentMode === 'projects' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                onClick={() => handleModeChange('projects')}
              >
                <PlusIcon size={16} /> Projects
              </button>
            </div>
          </div>

          <div className="sidebar-section">
            <h3>Current Mode: {currentMode.charAt(0).toUpperCase() + currentMode.slice(1)}</h3>
            <div className="mode-description">
              {currentMode === 'mindmap' && (
                <p>Transform notes and concepts into structured visual hierarchies.</p>
              )}
              {currentMode === 'storyteller' && (
                <p>Turn dry facts into engaging narratives with drama and characters.</p>
              )}
              {currentMode === 'projects' && (
                <p>Get hands-on project ideas to apply and prove your knowledge.</p>
              )}
            </div>
          </div>

          {currentMode === 'mindmap' && (
            <div className="sidebar-section">
              <h3>Notes to Mind Map</h3>
              <textarea
                value={userNotes}
                onChange={(e) => setUserNotes(e.target.value)}
                placeholder="Paste your notes here to convert to a mind map..."
                className="form-textarea notes-input"
                rows="6"
              />
              <button
                className="btn btn-primary btn-sm"
                onClick={handleNotesToMindMap}
                disabled={!userNotes.trim() || isLoading}
              >
                Create Mind Map
              </button>
            </div>
          )}

          <div className="sidebar-section">
            <h3>Quick Actions</h3>
            <div className="quick-actions">
              {currentMode === 'storyteller' && (
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={handleCreateStory}
                  disabled={isLoading}
                >
                  <BookIcon size={16} /> Create Story
                </button>
              )}
              {currentMode === 'projects' && (
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={handleGenerateProjects}
                  disabled={isLoading}
                >
                  <PlusIcon size={16} /> Generate Projects
                </button>
              )}
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => handleSendMessage("Connect these ideas to real-world applications")}
                disabled={isLoading}
              >
                🌍 Real World
              </button>
            </div>
          </div>

          <div className="sidebar-section">
            <h3>Synthesis Tips</h3>
            <div className="tips-list">
              <div className="tip-item">
                <BookIcon size={16} /> Mind maps show concept relationships
              </div>
              <div className="tip-item">
                <BookIcon size={16} /> Stories make facts memorable
              </div>
              <div className="tip-item">
                <PlusIcon size={16} /> Projects prove real understanding
              </div>
              <div className="tip-item">
                <CheckIcon size={16} /> Create to learn, don't just consume
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
          mode="creative_synthesis"
          subject={activeSession.subject || 'General'}
        />
      )}
    </div>
  );
};

export default CreativeSynthesis;