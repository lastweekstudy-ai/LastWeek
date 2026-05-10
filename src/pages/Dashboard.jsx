import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserSessions, getDueFlashcards } from '../appwrite/database';
import { getDueSchedules } from '../appwrite/studySchedule';
import StorageIndicator from '../components/StorageIndicator';
import SessionActions from '../components/SessionActions';
import LoadingSpinner from '../components/LoadingSpinner';
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

const Dashboard = () => {
  const { user, isGuest } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [dueFlashcards, setDueFlashcards] = useState([]);
  const [dueSchedules, setDueSchedules] = useState([]);
  const [scheduleError, setScheduleError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
      
      // Load sessions first (most important)
      const userSessions = await getUserSessions(user.$id);
      setSessions(userSessions);
      
      // Load flashcards in background (less critical)
      getDueFlashcards(user.$id)
        .then(flashcards => setDueFlashcards(flashcards))
        .catch(err => console.error('Failed to load flashcards:', err));

      // Load due review schedules in background
      getDueSchedules(user.$id)
        .then(schedules => setDueSchedules(schedules))
        .catch(err => setScheduleError('Could not load review schedule.'));
        
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error(err);
    } finally {
      setLoading(false);
    }
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

  const handleSessionDeleted = (sessionId) => {
    setSessions(prevSessions => 
      prevSessions.filter(session => session.$id !== sessionId)
    );
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
            <StorageIndicator userId={user.$id} className="compact" lazy={true} />
            <button
              className="btn btn-secondary"
              onClick={() => navigate('/pdf-manager')}
              title="Manage your PDF library"
            >
              <BookIcon size={16} />
              PDF Library
            </button>
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
            <ClockIcon size={24} className="section-icon" />
            Due for Review
          </h2>
          {scheduleError ? (
            <p className="text-muted">{scheduleError}</p>
          ) : dueSchedules.length === 0 ? (
            <p className="text-muted">No reviews due today</p>
          ) : (
            <div className="sessions-grid">
              {dueSchedules.map(schedule => {
                const daysOverdue = Math.floor((Date.now() - new Date(schedule.nextReviewDate).getTime()) / 86400000);
                const sessionTitle = sessions.find(s => s.$id === schedule.sessionId)?.title || schedule.sessionId;
                return (
                  <div
                    key={schedule.$id}
                    className="session-card card card-hover"
                    onClick={() => navigate(`/session/${schedule.sessionId}`)}
                  >
                    <div className="session-header">
                      <span className="mode-name">{schedule.subject}</span>
                      <span className="session-date">
                        {daysOverdue === 0 ? 'Due today' : `${daysOverdue} day(s) overdue`}
                      </span>
                    </div>
                    <h3 className="session-title">{schedule.topic?.slice(0, 80)}</h3>
                    <p className="session-subject">Session: {sessionTitle}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="dashboard-section">
          <h2>
            <BookIcon size={24} className="section-icon" />
            Recent Study Sessions
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
            <div className="sessions-grid">
              {sessions.map((session) => (
                <div
                  key={session.$id}
                  className="session-card card card-hover"
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
              ))}
            </div>
          )}
        </div>

        <div className="dashboard-section">
          <h2>Quick Actions</h2>
          <div className="quick-actions">
            <button
              className="action-card card card-hover"
              onClick={() => navigate('/mode-select')}
            >
              <div className="action-icon">
                <PlusIcon size={32} />
              </div>
              <div className="action-content">
                <h4>Start New Session</h4>
                <p>Begin studying with AI-powered modes</p>
              </div>
            </button>
            
            {dueFlashcards.length > 0 && (
              <button className="action-card card card-hover">
                <div className="action-icon">
                  <FlashcardIcon size={32} />
                </div>
                <div className="action-content">
                  <h4>Review Flashcards</h4>
                  <p>{dueFlashcards.length} cards due for review</p>
                </div>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;