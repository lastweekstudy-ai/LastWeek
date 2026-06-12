import React from 'react';

const StudyStatistics = ({ sessions, flashcards, dueFlashcards, totalMessages }) => {
  const stats = React.useMemo(() => {
    const totalSessions = sessions.length;

    // Use the real message count passed from parent (from getUserStorageUsage)
    const msgCount = typeof totalMessages === 'number' ? totalMessages : 0;

    const totalFlashcards = (flashcards || []).length;
    const dueCount = (dueFlashcards || []).filter(
      card => new Date(card.nextReviewAt) <= new Date()
    ).length;

    // Mode distribution
    const modeCount = sessions.reduce((acc, session) => {
      if (session.mode) acc[session.mode] = (acc[session.mode] || 0) + 1;
      return acc;
    }, {});

    const mostUsedModeEntry = Object.entries(modeCount).sort((a, b) => b[1] - a[1])[0];

    // Sessions in last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentSessions = sessions.filter(
      s => new Date(s.updatedAt || s.createdAt) >= sevenDaysAgo
    ).length;

    return {
      totalSessions,
      totalMessages: msgCount,
      totalFlashcards,
      dueFlashcards: dueCount,
      mostUsedMode: mostUsedModeEntry ? mostUsedModeEntry[0] : null,
      recentSessions,
    };
  }, [sessions, flashcards, dueFlashcards, totalMessages]);

  const getModeDisplayName = (mode) => {
    const names = {
      mental_model: 'Mental Model',
      active_recall: 'Active Recall',
      focus_breakdown: 'Focus Breakdown',
      collaborative_scholar: 'Scholar',
      creative_synthesis: 'Creative',
    };
    return names[mode] || mode;
  };

  const statCards = [
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
        </svg>
      ),
      value: stats.totalSessions,
      label: 'Total Sessions',
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      ),
      value: stats.totalMessages,
      label: 'Messages Sent',
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="7" width="20" height="15" rx="2" ry="2"/>
          <polyline points="17 2 12 7 7 2"/>
        </svg>
      ),
      value: stats.totalFlashcards,
      label: 'Flashcards Created',
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
      ),
      value: stats.dueFlashcards,
      label: 'Cards Due',
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
      ),
      value: stats.recentSessions,
      label: 'This Week',
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 20v-6M6 20V10M18 20V4"/>
        </svg>
      ),
      value: stats.mostUsedMode ? getModeDisplayName(stats.mostUsedMode) : 'N/A',
      label: 'Favorite Mode',
    },
  ];

  return (
    <div className="study-statistics">
      <h3 className="stats-title">Your Study Statistics</h3>
      <div className="stats-grid">
        {statCards.map((card, i) => (
          <div key={i} className="stat-card">
            <div className="stat-icon">{card.icon}</div>
            <div className="stat-content">
              <div className="stat-value">{card.value}</div>
              <div className="stat-label">{card.label}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StudyStatistics;
