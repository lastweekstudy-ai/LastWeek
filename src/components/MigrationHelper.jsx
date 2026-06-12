/**
 * MigrationHelper.jsx
 * 
 * One-time migration helper to update legacy resources.
 * Only shows for existing users who have resources to migrate.
 * New users don't see this.
 */

import React, { useState, useEffect } from 'react';
import { runFullMigration } from '../appwrite/migrateLegacyResources';

const MigrationHelper = ({ onMigrationComplete }) => {
  const [status, setStatus] = useState('idle'); // idle, running, complete, error
  const [message, setMessage] = useState('');
  const [results, setResults] = useState(null);
  const [showHelper, setShowHelper] = useState(false);

  // Check if migration has already been run
  useEffect(() => {
    const migrationDone = localStorage.getItem('resourceMigrationDone');
    const hasExistingResources = localStorage.getItem('hasExistingResources');
    
    // Only show for existing users with resources
    if (!migrationDone && hasExistingResources === 'true') {
      setShowHelper(true);
    }
  }, []);

  const handleMigration = async () => {
    setStatus('running');
    setMessage('Migrating resources...');

    try {
      const result = await runFullMigration();
      setResults(result);
      setStatus('complete');
      setMessage('✅ Migration complete!');
      localStorage.setItem('resourceMigrationDone', 'true');
      onMigrationComplete?.();
    } catch (err) {
      setStatus('error');
      setMessage(`❌ Migration failed: ${err.message}`);
    }
  };

  if (!showHelper) return null;

  return (
    <div className="migration-overlay">
      <div className="migration-panel">
        <div className="migration-header">
          <h3>🔄 Resource Migration</h3>
          <button 
            className="migration-close"
            onClick={() => setShowHelper(false)}
            disabled={status === 'running'}
          >
            ✕
          </button>
        </div>

        <div className="migration-content">
          {status === 'idle' && (
            <>
              <p className="migration-description">
                Your existing resources need to be updated to work with the new Shared Resource Library feature.
              </p>
              <p className="migration-info">
                This will set all existing resources to private by default. You can share them individually if you'd like.
              </p>
              <button
                className="migration-btn"
                onClick={handleMigration}
              >
                Start Migration
              </button>
            </>
          )}

          {status === 'running' && (
            <div className="migration-running">
              <div className="migration-spinner"></div>
              <p>{message}</p>
              <p className="migration-subtext">This may take a minute...</p>
            </div>
          )}

          {status === 'complete' && (
            <div className="migration-complete">
              <div className="migration-icon">✅</div>
              <p>{message}</p>
              {results && (
                <div className="migration-results">
                  <p>📄 PDF resources updated: <strong>{results.pdfCount}</strong></p>
                  <p>🎙️ Audio lectures updated: <strong>{results.audioCount}</strong></p>
                </div>
              )}
              <button
                className="migration-btn"
                onClick={() => setShowHelper(false)}
              >
                Done
              </button>
            </div>
          )}

          {status === 'error' && (
            <div className="migration-error">
              <div className="migration-icon">❌</div>
              <p>{message}</p>
              <button
                className="migration-btn"
                onClick={handleMigration}
              >
                Retry
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MigrationHelper;
