import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserSessions, getDueFlashcards, getUserFlashcards, getUserStorageUsage, deleteSession } from '../appwrite/database';
import { getUserExamPlans, daysUntilExam, getTodayTopics } from '../appwrite/examPlanner';
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
  const [allFlashcards, setAllFlashcards] = useState([]);
  const [totalMessages, setTotalMessages] = useState(0);
  const [examPlans, setExamPlans] = useState([]);
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
      
      // Load flashcards and message counts in parallel
      const [dueCards, allCards, storageUsage, examData] = await Promise.allSettled([
        getDueFlashcards(user.$id),
        getUserFlashcards(user.$id),
        getUserStorageUsage(user.$id),
        getUserExamPlans(user.$id),
      ]);

      if (dueCards.status === 'fulfilled') setDueFlashcards(dueCards.value);
      if (allCards.status === 'fulfilled') setAllFlashcards(allCards.value);
      if (storageUsage.status === 'fulfilled') setTotalMessages(storageUsage.value.totalMessages || 0);
      if (examData.status === 'fulfilled') setExamPlans(examData.value);
        
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
          <StudyStatistics sessions={sessions} flashcards={allFlashcards} dueFlashcards={dueFlashcards} totalMessages={totalMessages} />
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

        {/* ── Exam Planner widget ─────────────────────────────────────────── */}
        {examPlans.filter(p => daysUntilExam(p.examDate) >= 0).length > 0 && (
          <div className="dashboard-section">
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="section-icon">
                <rect x="3" y="4" width="18" height="18" rx="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              Exam Countdown
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {examPlans.filter(p => daysUntilExam(p.examDate) >= 0).map(plan => {
                const days = daysUntilExam(plan.examDate);
                const todayTopics = getTodayTopics(plan);
                const done = plan.topics.filter(t => t.done).length;
                const total = plan.topics.length;
                const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                return (
                  <div key={plan.$id} className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                      <div>
                        <span style={{ fontWeight: 700, color: 'var(--color-text-primary)', fontSize: '1rem' }}>{plan.examName}</span>
                        <span style={{
                          marginLeft: '10px',
                          fontSize: '0.8125rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '999px',
                          background: days <= 3 ? 'color-mix(in srgb, var(--color-warning) 15%, transparent)' : 'color-mix(in srgb, var(--color-accent) 12%, transparent)',
                          color: days <= 3 ? 'var(--color-warning)' : 'var(--color-accent)',
                        }}>
                          {days === 0 ? 'Today!' : `${days}d left`}
                        </span>
                      </div>
                      <button className="btn btn-ghost btn-sm" onClick={() => navigate('/exam-planner')}>
                        View Plan →
                      </button>
                    </div>
                    {/* Progress */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                        <span>{done}/{total} topics</span><span>{pct}%</span>
                      </div>
                      <div style={{ height: '5px', background: 'var(--color-bg-tertiary)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? 'var(--color-success)' : 'var(--color-accent)', borderRadius: '3px', transition: 'width 0.4s' }} />
                      </div>
                    </div>
                    {/* Today's topics — clickable, go directly to exam session */}
                    {todayTopics.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Today</span>
                        {todayTopics.map(topicName => {
                          const idx = plan.topics.findIndex(t => t.name === topicName);
                          const t = plan.topics[idx];
                          return (
                            <button
                              key={topicName}
                              className="btn btn-primary"
                              style={{ fontSize: '0.8125rem', padding: '0.4rem 0.875rem', textAlign: 'left', justifyContent: 'flex-start' }}
                              onClick={() => navigate(`/exam-session/${plan.$id}/${idx}`)}
                              disabled={t?.done}
                            >
                              {t?.sessionId ? '▶ Resume' : '▶ Start'}: {topicName}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
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

                      {/* Session summary — shown if available */}
                      {session.summary && (
                        <div className="session-summary">
                          {session.summary.split('\n').filter(Boolean).map((line, i) => (
                            <p key={i} className="session-summary-line">{line}</p>
                          ))}
                        </div>
                      )}
                      
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
