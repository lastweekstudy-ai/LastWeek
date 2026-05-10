import { createContext, useContext, useState } from 'react';
import { 
  createSession, 
  getSession, 
  updateSession, 
  createMessage, 
  getSessionMessages 
} from '../appwrite/database';
import { useAuth } from './AuthContext';

const SessionContext = createContext();

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};

export const SessionProvider = ({ children }) => {
  const { user } = useAuth();
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [currentMode, setCurrentMode] = useState(null);
  const [subject, setSubject] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);
  const [loadingSessionId, setLoadingSessionId] = useState(null);

  // Start a new session
  const startSession = async (mode, studySubject, title) => {
    if (!user) throw new Error('User must be logged in');
    
    try {
      setIsLoading(true);
      setError(null);
      
      const session = await createSession(user.$id, mode, studySubject, title);
      setActiveSession(session);
      setCurrentMode(mode);
      setSubject(studySubject);
      setMessages([]);
      
      return session;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Load an existing session and restore full context
  const loadSession = async (sessionId) => {
    if (!user) throw new Error('User must be logged in');
    
    if (loadingSessionId === sessionId) {
      return;
    }
    
    if (activeSession && activeSession.$id === sessionId) {
      return activeSession;
    }
    
    setLoadingSessionId(sessionId);
    
    try {
      setIsLoading(true);
      setError(null);
      
      const session = await getSession(sessionId);
      const sessionMessages = await getSessionMessages(sessionId);
      
      setActiveSession(session);
      setCurrentMode(session.mode);
      setSubject(session.subject);
      setMessages(sessionMessages);
      
      return session;
    } catch (err) {
      console.error('SessionContext loadSession error:', err);
      setError(err.message);
      
      // Clear any existing session data on error
      setActiveSession(null);
      setMessages([]);
      setCurrentMode(null);
      setSubject(null);
      
      throw err;
    } finally {
      setIsLoading(false);
      setLoadingSessionId(null);
    }
  };

  // Send a message and get AI response
  const sendMessage = async (userMessage, aiResponseCallback, fileAttachment = null) => {
    if (!activeSession || !user) throw new Error('No active session');
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Create message content with file attachment if present
      let messageContent = userMessage;
      if (fileAttachment) {
        // Store file metadata in message for display
        messageContent = JSON.stringify({
          text: userMessage,
          file: {
            name: fileAttachment.name,
            type: fileAttachment.type,
            url: fileAttachment.fileUrl,
            storageFileId: fileAttachment.storageFileId
          }
        });
      }
      
      // Save user message to database
      const userMsg = await createMessage(
        activeSession.$id, 
        user.$id, 
        'user', 
        messageContent
      );
      
      // Update local state immediately
      const newMessages = [...messages, userMsg];
      setMessages(newMessages);
      
      // Call AI with full conversation history
      const aiResponse = await aiResponseCallback(newMessages);
      
      // Save AI response to database
      const aiMsg = await createMessage(
        activeSession.$id,
        user.$id,
        'assistant',
        aiResponse
      );
      
      // Update local state with AI response
      setMessages(prev => [...prev, aiMsg]);
      
      // Update session timestamp
      await updateSession(activeSession.$id, {});
      
      return aiMsg;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Send a message and stream the AI response
  const sendMessageStreaming = async (userMessage, streamCallback, fileAttachment = null) => {
    if (!activeSession || !user) throw new Error('No active session');

    // Build message content (same file-attachment handling as sendMessage)
    let messageContent = userMessage;
    if (fileAttachment) {
      messageContent = JSON.stringify({
        text: userMessage,
        file: {
          name: fileAttachment.name,
          type: fileAttachment.type,
          url: fileAttachment.fileUrl,
          storageFileId: fileAttachment.storageFileId
        }
      });
    }

    // Save user message to database
    const userMsg = await createMessage(
      activeSession.$id,
      user.$id,
      'user',
      messageContent
    );

    // Update local state with user message
    setMessages(prev => [...prev, userMsg]);

    // Create a streaming placeholder for the assistant reply
    const placeholderId = `streaming-${Date.now()}`;
    const placeholder = {
      $id: placeholderId,
      role: 'assistant',
      content: '',
      isStreaming: true,
      createdAt: new Date().toISOString()
    };
    setMessages(prev => [...prev, placeholder]);

    setIsStreaming(true);

    let fullText = '';

    try {
      const onChunk = (delta) => {
        fullText += delta;
        setMessages(prev =>
          prev.map(m =>
            m.$id === placeholderId
              ? { ...m, content: m.content + delta }
              : m
          )
        );
      };

      await streamCallback(onChunk);

      // Persist the completed assistant message
      const persistedMsg = await createMessage(
        activeSession.$id,
        user.$id,
        'assistant',
        fullText
      );

      // Replace placeholder with the persisted document
      setMessages(prev =>
        prev.map(m => (m.$id === placeholderId ? persistedMsg : m))
      );

      // Update session timestamp
      await updateSession(activeSession.$id, {});

      return persistedMsg;
    } catch (err) {
      setError(err.message);
      // Remove the placeholder on error
      setMessages(prev => prev.filter(m => m.$id !== placeholderId));
      throw err;
    } finally {
      setIsStreaming(false);
    }
  };

  // Switch to a new mode while preserving the current session and all its messages
  const switchMode = async (newMode) => {
    if (!activeSession || !user) throw new Error('No active session');

    // If already on this mode, do nothing
    if (activeSession.mode === newMode) return activeSession;

    try {
      setIsLoading(true);
      setError(null);

      const modeNames = {
        mental_model: 'Mental Model',
        active_recall: 'Active Recall',
        focus_breakdown: 'Focus Breakdown',
        collaborative_scholar: 'Collaborative Scholar',
        creative_synthesis: 'Creative Synthesis',
      };

      // Update the mode field on the existing session — no new session created
      const updatedSession = await updateSession(activeSession.$id, { mode: newMode });

      // Update local state to reflect the new mode
      setActiveSession(updatedSession);
      setCurrentMode(newMode);

      // Inject a system-level transition message so the AI knows the approach changed
      const transitionMsg = await createMessage(
        activeSession.$id,
        user.$id,
        'assistant',
        `[Mode switched to **${modeNames[newMode] || newMode}**] I'll now approach our conversation about **${activeSession.subject}** using the ${modeNames[newMode] || newMode} method. Your full conversation history is preserved — let's continue!`
      );

      setMessages(prev => [...prev, transitionMsg]);

      return updatedSession;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // End current session
  const endSession = () => {
    setActiveSession(null);
    setMessages([]);
    setCurrentMode(null);
    setSubject(null);
    setError(null);
  };

  // Resume a session by ID
  const resumeSession = async (sessionId) => {
    return await loadSession(sessionId);
  };

  const value = {
    activeSession,
    messages,
    currentMode,
    subject,
    isLoading,
    isStreaming,
    error,
    startSession,
    loadSession,
    sendMessage,
    sendMessageStreaming,
    switchMode,
    endSession,
    resumeSession
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
};