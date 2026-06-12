import React from 'react';

const BulkActions = ({ selectedSessions, onDelete, onExport, onClearSelection }) => {
  if (selectedSessions.length === 0) return null;

  return (
    <div className="bulk-actions">
      <div className="bulk-actions-info">
        <span className="selected-count">{selectedSessions.length} session{selectedSessions.length !== 1 ? 's' : ''} selected</span>
        <button className="btn-ghost btn-sm" onClick={onClearSelection}>
          Clear selection
        </button>
      </div>
      
      <div className="bulk-actions-buttons">
        <button className="btn btn-secondary btn-sm" onClick={onExport}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Export
        </button>
        
        <button className="btn btn-secondary btn-sm btn-danger" onClick={onDelete}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
          Delete
        </button>
      </div>
    </div>
  );
};

export default BulkActions;
