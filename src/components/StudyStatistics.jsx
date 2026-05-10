import React from 'react';
import '../styles/StudyStatistics.css';

const StudyStatistics = ({ sessions, flashcards }) => {
  const stats = React.useMemo(() => {
    const totalSessions = sessions.length;
    const totalMessages = sessions.reduce((acc, session) => acc + (session.messageCount || 0), 0);
    const totalFlashcards = flashcards.length;
    const dueFlashcards = flashcards.filter(card => new Date(card.nextReviewAt) <= new Date()).length;
    
    // Mode distribution
    const modeCount = sessions.reduce((acc, session) => {
      acc[session.mode] = (acc[session.mode] || 0) + 1;
      return acc;
    }, {});
    
    const mostUsedMode = Object.entries(modeCount).sort((a, b) => b[1] - a[1])[0];
    
    // Study streak (sessions in last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentSessions = sessions.filter(s => new Date(s.updatedAt) >= sevenDaysAgo).length;
    
    return {
      totalSessions,
      totalMessages,
      totalFlashcards,
      dueFlashcards,
      mostUsedMode: mostUsedMode ? mostUsedMode[0] : null,
      recentSessions,
    };
  }, [sessions, flashcards]);

  const getModeDisplayName = (mode) => {
    const names = {
      'mental_model': 'Mental Model',
      'active_recall': 'Active Recall',
      'focus_breakdown': 'Focus Breakdown',
      'collaborative_scholar': 'Collaborative Scholar',
      'creative_synthesis': 'Creative Synthesis',
    };
    return names[mode] || mode;
  };

  return (
    <div className="study-statistics">
      <h3 className="stats-title">Your Study Statistics</h3>
      
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalSessions}</div>
            <div className="stat-label">Total Sessions</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalMessages}</div>
            <div className="stat-label">Messages Sent</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="7" width="20" height="15" rx="2" ry="2"/>
              <polyline points="17 2 12 7 7 2"/>
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalFlashcards}</div>
            <div className="stat-label">Flashcards Created</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.dueFlashcards}</div>
            <div className="stat-label">Cards Due</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.recentSessions}</div>
            <div className="stat-label">This Week</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 20v-6M6 20V10M18 20V4"/>
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.mostUsedMode ? getModeDisplayName(stats.mostUsedMode).split(' ')[0] : 'N/A'}</div>
            <div className="stat-label">Favorite Mode</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudyStatistics;
