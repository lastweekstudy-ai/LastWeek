import React, { useState, useEffect } from 'react';
import {
  createFlashcard,
  getUserFlashcardCollections,
  createFlashcardCollection,
  updateFlashcard,
} from '../appwrite/database';
import { getNextReviewDate } from '../utils/spacedRepetition';

const FlashcardCreateModal = ({
  userId,
  sessionId,
  subject,
  isOpen,
  onClose,
  onSaved,
  initialFront = '',
  initialBack = '',
}) => {
  const [front, setFront] = useState(initialFront);
  const [back, setBack] = useState(initialBack);
  const [collections, setCollections] = useState([]);
  const [selectedCollection, setSelectedCollection] = useState('');
  const [newCollectionName, setNewCollectionName] = useState('');
  const [showNewCollection, setShowNewCollection] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setFront(initialFront);
      setBack(initialBack);
      setError('');
      loadCollections();
    }
  }, [isOpen, initialFront, initialBack]);

  const loadCollections = async () => {
    if (!userId) return;
    try {
      const cols = await getUserFlashcardCollections(userId);
      setCollections(cols);
      if (cols.length > 0 && !selectedCollection) {
        setSelectedCollection(cols[0].$id);
      }
    } catch {
      // Non-fatal.
    }
  };

  const handleSave = async () => {
    if (!front.trim()) { setError('Front side cannot be empty.'); return; }
    if (!back.trim()) { setError('Back side cannot be empty.'); return; }
    if (!userId) { setError('You must be logged in to save flashcards.'); return; }

    setSaving(true);
    setError('');

    try {
      let collectionId = selectedCollection || null;

      if (showNewCollection && newCollectionName.trim()) {
        const newCol = await createFlashcardCollection(userId, newCollectionName.trim());
        collectionId = newCol.$id;
        setCollections(prev => [...prev, newCol]);
        setSelectedCollection(newCol.$id);
        setShowNewCollection(false);
        setNewCollectionName('');
      }

      const flashcard = await createFlashcard(
        userId,
        sessionId || 'manual',
        front.trim(),
        back.trim(),
        { collectionId, source: 'manual', subject: subject || 'General' }
      );

      await updateFlashcard(flashcard.$id, 2, getNextReviewDate(2));

      onSaved?.(flashcard);
      onClose();
    } catch (err) {
      setError('Failed to save flashcard: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="flashcard-create-overlay"
      onClick={(event) => event.target === event.currentTarget && onClose()}
    >
      <div className="flashcard-create-panel">
        <div className="flashcard-create-header">
          <h3>Create Flashcard</h3>
          <button onClick={onClose} className="flashcard-create-close" title="Close">
            x
          </button>
        </div>

        <div className="flashcard-create-field">
          <label>Front (Question)</label>
          <textarea
            value={front}
            onChange={event => setFront(event.target.value)}
            placeholder="What is the question or term?"
            rows={3}
          />
        </div>

        <div className="flashcard-create-field">
          <label>Back (Answer)</label>
          <textarea
            value={back}
            onChange={event => setBack(event.target.value)}
            placeholder="What is the answer or explanation?"
            rows={4}
          />
        </div>

        <div className="flashcard-create-field">
          <label>Collection</label>
          {!showNewCollection ? (
            <div className="flashcard-create-row">
              <select
                value={selectedCollection}
                onChange={event => setSelectedCollection(event.target.value)}
              >
                <option value="">No collection (General)</option>
                {collections.map(col => (
                  <option key={col.$id} value={col.$id}>
                    {col.name}
                  </option>
                ))}
              </select>
              <button onClick={() => setShowNewCollection(true)} className="btn btn-secondary">
                + New
              </button>
            </div>
          ) : (
            <div className="flashcard-create-row">
              <input
                type="text"
                value={newCollectionName}
                onChange={event => setNewCollectionName(event.target.value)}
                placeholder="Collection name..."
                autoFocus
              />
              <button
                onClick={() => { setShowNewCollection(false); setNewCollectionName(''); }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {error && <p className="flashcard-create-error">{error}</p>}

        <div className="flashcard-create-actions">
          <button onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !front.trim() || !back.trim()}
            className="btn btn-primary"
          >
            {saving ? 'Saving...' : 'Save Card'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FlashcardCreateModal;
