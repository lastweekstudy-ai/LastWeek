import React, { useState } from 'react';
import '../styles/SessionSearch.css';

const SessionSearch = ({ sessions, onFilteredSessions }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMode, setSelectedMode] = useState('all');
  const [sortBy, setSortBy] = useState('recent');

  const modes = [
    { id: 'all', name: 'All Modes' },
    { id: 'mental_model', name: 'Mental Model' },
    { id: 'active_recall', name: 'Active Recall' },
    { id: 'focus_breakdown', name: 'Focus Breakdown' },
    { id: 'collaborative_scholar', name: 'Collaborative Scholar' },
    { id: 'creative_synthesis', name: 'Creative Synthesis' },
  ];

  React.useEffect(() => {
    let filtered = [...sessions];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(session =>
        session.title.toLowerCase().includes(query) ||
        session.subject.toLowerCase().includes(query)
      );
    }

    // Filter by mode
    if (selectedMode !== 'all') {
      filtered = filtered.filter(session => session.mode === selectedMode);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.updatedAt) - new Date(a.updatedAt);
        case 'oldest':
          return new Date(a.updatedAt) - new Date(b.updatedAt);
        case 'title':
          return a.title.localeCompare(b.title);
        case 'subject':
          return a.subject.localeCompare(b.subject);
        default:
          return 0;
      }
    });

    onFilteredSessions(filtered);
  }, [searchQuery, selectedMode, sortBy, sessions, onFilteredSessions]);

  return (
    <div className="session-search">
      <div className="search-input-wrapper">
        <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          type="text"
          className="search-input"
          placeholder="Search by title or subject..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button
            className="search-clear"
            onClick={() => setSearchQuery('')}
            aria-label="Clear search"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        )}
      </div>

      <div className="search-filters">
        <select
          className={`filter-select${selectedMode !== 'all' ? ' is-filtered' : ''}`}
          value={selectedMode}
          onChange={(e) => setSelectedMode(e.target.value)}
        >
          {modes.map(mode => (
            <option key={mode.id} value={mode.id}>{mode.name}</option>
          ))}
        </select>

        <select
          className={`filter-select${sortBy !== 'recent' ? ' is-filtered' : ''}`}
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="recent">Most Recent</option>
          <option value="oldest">Oldest First</option>
          <option value="title">Title (A-Z)</option>
          <option value="subject">Subject (A-Z)</option>
        </select>
      </div>
    </div>
  );
};

export default SessionSearch;
