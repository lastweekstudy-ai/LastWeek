import React, { useState, useEffect, useRef } from 'react';
import { createPDFNote, updatePDFNote, deletePDFNote, getPageNotes } from '../appwrite/pdfNotes';
import { formatDistanceToNow } from 'date-fns';

const PDFNoteEditor = ({ pdfResource, pageNumber, userId, onClose }) => {
  const [notes, setNotes] = useState([]);
  const [newNoteText, setNewNoteText] = useState('');
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    loadNotes();
  }, [pdfResource.$id, pageNumber]);

  const loadNotes = async () => {
    try {
      setLoading(true);
      const pageNotes = await getPageNotes(pdfResource.$id, pageNumber);
      setNotes(pageNotes);
    } catch (error) {
      console.error('Failed to load notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNote = async () => {
    if (!newNoteText.trim()) return;

    try {
      setSaving(true);
      await createPDFNote(
        userId,
        pdfResource.$id,
        pageNumber,
        newNoteText.trim()
      );
      setNewNoteText('');
      await loadNotes();
    } catch (error) {
      console.error('Failed to create note:', error);
      alert('Failed to create note. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateNote = async (noteId) => {
    if (!editingText.trim()) return;

    try {
      setSaving(true);
      await updatePDFNote(noteId, editingText.trim());
      setEditingNoteId(null);
      setEditingText('');
      await loadNotes();
    } catch (error) {
      console.error('Failed to update note:', error);
      alert('Failed to update note. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!confirm('Delete this note?')) return;

    try {
      await deletePDFNote(noteId);
      await loadNotes();
    } catch (error) {
      console.error('Failed to delete note:', error);
      alert('Failed to delete note. Please try again.');
    }
  };

  const startEditing = (note) => {
    setEditingNoteId(note.$id);
    setEditingText(note.noteText);
  };

  const cancelEditing = () => {
    setEditingNoteId(null);
    setEditingText('');
  };

  const handleKeyDown = (e, action) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      action();
    }
  };

  return (
    <div className="pdf-note-editor">
      <div className="note-editor-header">
        <div className="note-editor-title">
          <span className="note-icon">📝</span>
          <h3>Notes - Page {pageNumber}</h3>
        </div>
        <button onClick={onClose} className="btn-close" title="Close notes">
          ✕
        </button>
      </div>

      <div className="note-editor-content">
        {/* New Note Form */}
        <div className="new-note-form">
          <textarea
            ref={textareaRef}
            value={newNoteText}
            onChange={(e) => setNewNoteText(e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, handleCreateNote)}
            placeholder="Write a note for this page... (Ctrl+Enter to save)"
            className="note-textarea"
            rows="4"
            disabled={saving}
          />
          <div className="note-form-actions">
            <button
              onClick={handleCreateNote}
              disabled={!newNoteText.trim() || saving}
              className="btn-primary"
            >
              {saving ? 'Saving...' : 'Add Note'}
            </button>
            <span className="note-hint">Ctrl+Enter to save</span>
          </div>
        </div>

        {/* Existing Notes */}
        <div className="notes-list">
          {loading ? (
            <div className="notes-loading">
              <div className="spinner-small"></div>
              <span>Loading notes...</span>
            </div>
          ) : notes.length === 0 ? (
            <div className="notes-empty">
              <div className="empty-icon">📄</div>
              <p>No notes on this page yet</p>
              <span className="empty-hint">Add your first note above</span>
            </div>
          ) : (
            notes.map((note) => (
              <div key={note.$id} className="note-item">
                {editingNoteId === note.$id ? (
                  // Edit Mode
                  <div className="note-edit-form">
                    <textarea
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, () => handleUpdateNote(note.$id))}
                      className="note-textarea"
                      rows="4"
                      autoFocus
                    />
                    <div className="note-edit-actions">
                      <button
                        onClick={() => handleUpdateNote(note.$id)}
                        disabled={!editingText.trim() || saving}
                        className="btn-primary btn-sm"
                      >
                        {saving ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={cancelEditing}
                        disabled={saving}
                        className="btn-secondary btn-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <>
                    <div className="note-text">
                      {note.noteText}
                    </div>
                    <div className="note-meta">
                      <span className="note-time">
                        {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })}
                      </span>
                      {note.updatedAt !== note.createdAt && (
                        <span className="note-edited">(edited)</span>
                      )}
                    </div>
                    <div className="note-actions">
                      <button
                        onClick={() => startEditing(note)}
                        className="btn-icon-sm"
                        title="Edit note"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDeleteNote(note.$id)}
                        className="btn-icon-sm btn-danger"
                        title="Delete note"
                      >
                        🗑️
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Footer Stats */}
      <div className="note-editor-footer">
        <span className="note-count">
          {notes.length} note{notes.length !== 1 ? 's' : ''} on this page
        </span>
      </div>
    </div>
  );
};

export default PDFNoteEditor;
