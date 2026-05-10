import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserSessions, getDueFlashcards, deleteSession } from '../appwrite/database';
import StorageIndicator from '../components/StorageIndicator';
import SessionActions from '../components/SessionActions';
import SessionSearch from '../components/SessionSearch';
import BulkActions from '../components/BulkActions';
import StudyStatistics from '../components/StudyStatistics';
import LoadingSpinner from '../components/LoadingSpinner';
import useKeyboardShortcuts from '../hooks/useKeyboardShortcuts';
import { exportSessions, exportSession, exportSessionAsMarkdown } from '../utils/exportImport';
import { 
  PlusIcon, 
  FlashcardIcon, 
  ClockIcon, 
  BookIcon,
  ArrowRightIcon,
  MentalModelIcon,
  ActiveRecallIcon,
  FocusBreakdownIcon,
  CollaborativeScholarIcon,
  CreativeSynthesisIcon
} from '../components/Icons';
import '../styles/Dashboard.css';
import '../styles/StorageIndicator.css';
import '../styles/SessionActions.css';
import '../styles/LoadingSpinner.css';
import '../styles/SessionSearch.css';
import '../styles/BulkActions.css';
import '../styles/StudyStatistics.css';

const DashboardEnhanced = () => {
  const { user, isGuest } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [filteredSessions, setFilteredSessions] = useState([]);
  const [dueFlashcards, setDueFlashcards] = useState([]);
  const [selectedSessions, setSelectedSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showStats, setShowStats] = useState(false);

  // Keyboard shortcuts
  useKeyboardShortcuts([
    { key: 'd', ctrl: true, callback: () => navigate('/dashboard') },
    { key: 'n', ctrl: true, callback: () => navigate('/mode-select') },
    { key: 'f', ctrl: true, callback: () => document.querySelector('.search-input')?.focus() },
    { key: 'Escape', callback: () => setSelectedSessions([]) },
  ]);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    loadDashboardData();
  }, [user, navigate]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      const userSessions = await getUserSessions(user.$id);
      setSessions(userSessions);
      setFilteredSessions(userSessions);
      
      getDueFlashcards(user.$id)
        .then(flashcards => setDueFlashcards(flashcards))
        .catch(err => console.error('Failed to load flashcards:', err));
        
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilteredSessions = useCallback((filtered) => {
    setFilteredSessions(filtered);
  }, []);

  const handleSessionDeleted = (sessionId) => {
    setSessions(prevSessions => 
      prevSessions.filter(session => session.$id !== sessionId)
    );
    setSelectedSessions(prev => prev.filter(id => id !== sessionId));
  };

  const toggleSessionSelection = (sessionId) => {
    setSelectedSessions(prev =>
      prev.includes(sessionId)
        ? prev.filter(id => id !== sessionId)
        : [...prev, sessionId]
    );
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedSessions.length} session(s)? This cannot be undone.`)) {
      return;
    }

    try {
      await Promise.all(selectedSessions.map(id => deleteSession(id)));
      setSessions(prev => prev.filter(s => !selectedSessions.includes(s.$id)));
      setSelectedSessions([]);
    } catch (err) {
      alert('Failed to delete some sessions: ' + err.message);
    }
  };

  const handleBulkExport = () => {
    const sessionsToExport = sessions.filter(s => selectedSessions.includes(s.$id));
    exportSessions(sessionsToExport);
    setSelectedSessions([]);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getModeIcon = (mode, size = 20) => {
    const iconProps = { size, className: "mode-icon-small" };
    
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
        return <BookIcon {...iconProps} />;
    }
  };

  const getModeName = (mode) => {
    switch (mode) {
      case 'mental_model':
        return 'Mental Model';
      case 'active_recall':
        return 'Active Recall';
      case 'focus_breakdown':
        return 'Focus Breakdown';
      case 'collaborative_scholar':
        return 'Collaborative Scholar';
      case 'creative_synthesis':
        return 'Creative Synthesis';
      default:
        return mode;
    }
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="container">
          <div className="dashboard-header">
            <div>
              <h1>Welcome back{isGuest ? ', Guest' : `, ${user?.name || 'Student'}`}</h1>
              <p className="dashboard-subtitle">
                Loading your dashboard...
              </p>
            </div>
          </div>
          <div className="loading-state">
            <LoadingSpinner size={32} className="center" />
            <p>Loading your study sessions...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="container">
        <div className="dashboard-header">
          <div>
            <h1>Welcome back{isGuest ? ', Guest' : `, ${user.name || 'Student'}`}</h1>
            <p className="dashboard-subtitle">
              Ready to continue your learning journey?
            </p>
          </div>
          <div className="header-actions">
            <button
              className="btn btn-secondary"
              onClick={() => setShowStats(!showStats)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="20" x2="12" y2="10"/>
                <line x1="18" y1="20" x2="18" y2="4"/>
                <line x1="6" y1="20" x2="6" y2="16"/>
              </svg>
              {showStats ? 'Hide' : 'Show'} Stats
            </button>
            <StorageIndicator userId={user.$id} className="compact" lazy={true} />
            <button
              className="btn btn-primary"
              onClick={() => navigate('/mode-select')}
            >
              <PlusIcon size={16} />
              New Session
            </button>
          </div>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {showStats && (
          <StudyStatistics sessions={sessions} flashcards={dueFlashcards} />
        )}

        {dueFlashcards.length > 0 && (
          <div className="dashboard-section">
            <h2>
              <FlashcardIcon size={24} className="section-icon" />
              Flashcards Due for Review
            </h2>
            <div className="flashcard-alerts">
              <div className="alert alert-info">
                <ClockIcon size={20} />
                <span>
                  You have {dueFlashcards.length} flashcard{dueFlashcards.length !== 1 ? 's' : ''} ready for review.
                </span>
                <button className="btn btn-secondary btn-sm ml-sm">
                  Review Now
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="dashboard-section">
          <h2>
            <BookIcon size={24} className="section-icon" />
            Study Sessions
          </h2>
          
          {sessions.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <BookIcon size={64} />
              </div>
              <h3>No study sessions yet</h3>
              <p>Start your first session to begin learning with AI-powered study modes.</p>
              <button
                className="btn btn-primary"
                onClick={() => navigate('/mode-select')}
              >
                <PlusIcon size={16} />
                Start First Session
              </button>
            </div>
          ) : (
            <>
              <SessionSearch sessions={sessions} onFilteredSessions={handleFilteredSessions} />
              
              <BulkActions
                selectedSessions={selectedSessions}
                onDelete={handleBulkDelete}
                onExport={handleBulkExport}
                onClearSelection={() => setSelectedSessions([])}
              />
              
              <div className="sessions-grid">
                {filteredSessions.map((session) => (
                  <div
                    key={session.$id}
                    className={`session-card card ${selectedSessions.includes(session.$id) ? 'selected' : ''}`}
                  >
                    <div className="session-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedSessions.includes(session.$id)}
                        onChange={() => toggleSessionSelection(session.$id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    
                    <div
                      className="session-content"
                      onClick={() => navigate(`/session/${session.$id}`)}
                    >
                      <div className="session-header">
                        <div className="session-mode">
                          {getModeIcon(session.mode)}
                          <span className="mode-name">{getModeName(session.mode)}</span>
                        </div>
                        <div className="session-meta">
                          <span className="session-date">
                            <ClockIcon size={14} />
                            {formatDate(session.updatedAt)}
                          </span>
                          <SessionActions 
                            session={session} 
                            onSessionDeleted={handleSessionDeleted}
                          />
                        </div>
                      </div>
                      
                      <h3 className="session-title">{session.title}</h3>
                      <p className="session-subject">Subject: {session.subject}</p>
                      
                      <div className="session-footer">
                        <span className="text-sm text-muted">
                          <ArrowRightIcon size={14} />
                          Click to resume
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardEnhanced;
