import React, { useState, useEffect } from 'react';
import { deleteSession } from '../appwrite/database';
import { triggerStorageUpdate } from './StorageIndicator';
import { DeleteIcon, DotsVerticalIcon, WarningIcon } from './Icons';

const SessionActions = ({ session, onSessionDeleted, className = "" }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Add/remove class to body when modal opens/closes
  useEffect(() => {
    if (showDeleteConfirm) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    
    // Cleanup on unmount
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [showDeleteConfirm]);

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
    setShowMenu(false);
  };

  const handleDeleteConfirm = async (e) => {
    e.stopPropagation();
    try {
      setDeleting(true);
      await deleteSession(session.$id);
      onSessionDeleted(session.$id);
      setShowDeleteConfirm(false);
      triggerStorageUpdate();
    } catch (error) {
      console.error('Failed to delete session:', error);
      alert('Failed to delete session. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = (e) => {
    e.stopPropagation();
    setShowDeleteConfirm(false);
  };

  const toggleMenu = (e) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  return (
    <div className={`session-actions ${className}`}>
      <button 
        className="btn btn-ghost btn-sm action-trigger"
        onClick={toggleMenu}
        title="Session options"
      >
        <DotsVerticalIcon size={16} />
      </button>

      {showMenu && (
        <>
          <div className="action-overlay" onClick={() => setShowMenu(false)} />
          <div className="action-menu">
            <button 
              className="action-item delete-action"
              onClick={handleDeleteClick}
            >
              <DeleteIcon size={16} />
              Delete Session
            </button>
          </div>
        </>
      )}

      {showDeleteConfirm && (
        <>
          <div className="modal-backdrop" onClick={handleDeleteCancel} />
          <div className="delete-confirm-modal">
            <div className="modal-content">
              <div className="modal-header">
                <WarningIcon size={24} />
                <h3>Delete Session?</h3>
              </div>
              
              <div className="modal-body">
                <p>
                  Are you sure you want to delete "<strong>{session.title}</strong>"?
                </p>
                <p className="text-sm text-muted">
                  This will permanently delete the session and all its messages and flashcards. 
                  This action cannot be undone.
                </p>
              </div>
              
              <div className="modal-actions">
                <button 
                  className="btn btn-ghost"
                  onClick={handleDeleteCancel}
                  disabled={deleting}
                >
                  Cancel
                </button>
                <button 
                  className="btn btn-danger"
                  onClick={handleDeleteConfirm}
                  disabled={deleting}
                >
                  {deleting ? 'Deleting...' : 'Delete Session'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SessionActions;