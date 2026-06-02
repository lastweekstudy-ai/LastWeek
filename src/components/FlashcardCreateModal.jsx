import React, { useState, useEffect } from 'react';
import {
  createFlashcard,
  getUserFlashcardCollections,
  createFlashcardCollection,
} from '../appwrite/database';
import { getNextReviewDate } from '../utils/spacedRepetition';
import { updateFlashcard } from '../appwrite/database';

/**
 * FlashcardCreateModal
 *
 * A modal for manually creating a flashcard.
 * Props:
 *   userId      {string}
 *   sessionId   {string}
 *   subject     {string}
 *   isOpen      {bool}
 *   onClose     {function}
 *   onSaved     {function(flashcard)} — called after successful save
 *   initialFront {string}  — pre-fill front (optional)
 *   initialBack  {string}  — pre-fill back (optional)
 */
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

  // Reset form when modal opens
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
      // Default to first collection if available
      if (cols.length > 0 && !selectedCollection) {
        setSelectedCollection(cols[0].$id);
      }
    } catch {
      // Non-fatal
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

      // Create new collection if requested
      if (showNewCollection && newCollectionName.trim()) {
        const newCol = await createFlashcardCollection(userId, newCollectionName.trim());
        collectionId = newCol.$id;
        setCollections(prev => [...prev, newCol]);
        setSelectedCollection(newCol.$id);
        setShowNewCollection(false);
        setNewCollectionName('');
      }

      // Create the flashcard
      const flashcard = await createFlashcard(
        userId,
        sessionId || 'manual',
        front.trim(),
        back.trim(),
        { collectionId, source: 'manual', subject: subject || 'General' }
      );

      // Set initial confidence to 2 (okay) with next review tomorrow
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
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        backgroundColor: 'var(--color-bg-primary)',
        borderRadius: '12px',
        padding: '1.5rem',
        width: '100%',
        maxWidth: '520px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        border: '1px solid var(--color-border)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            🃏 Create Flashcard
          </h3>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem', color: 'var(--color-text-muted)', lineHeight: 1 }}
          >
            ✕
          </button>
        </div>

        {/* Front */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Front (Question)
          </label>
          <textarea
            value={front}
            onChange={e => setFront(e.target.value)}
            placeholder="What is the question or term?"
            rows={3}
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: '0.75rem', borderRadius: '8px',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-bg-secondary)',
              color: 'var(--color-text-primary)',
              fontSize: '0.95rem', resize: 'vertical',
              fontFamily: 'inherit',
            }}
          />
        </div>

        {/* Back */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Back (Answer)
          </label>
          <textarea
            value={back}
            onChange={e => setBack(e.target.value)}
            placeholder="What is the answer or explanation?"
            rows={4}
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: '0.75rem', borderRadius: '8px',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-bg-secondary)',
              color: 'var(--color-text-primary)',
              fontSize: '0.95rem', resize: 'vertical',
              fontFamily: 'inherit',
            }}
          />
        </div>

        {/* Collection picker */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Collection
          </label>
          {!showNewCollection ? (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <select
                value={selectedCollection}
                onChange={e => setSelectedCollection(e.target.value)}
                style={{
                  flex: 1, padding: '0.6rem 0.75rem', borderRadius: '8px',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-bg-secondary)',
                  color: 'var(--color-text-primary)',
                  fontSize: '0.9rem',
                }}
              >
                <option value="">No collection (General)</option>
                {collections.map(col => (
                  <option key={col.$id} value={col.$id}>
                    {col.icon} {col.name}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setShowNewCollection(true)}
                style={{
                  padding: '0.6rem 0.9rem', borderRadius: '8px',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-bg-secondary)',
                  color: 'var(--color-text-secondary)',
                  cursor: 'pointer', fontSize: '0.85rem', whiteSpace: 'nowrap',
                }}
              >
                + New
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                value={newCollectionName}
                onChange={e => setNewCollectionName(e.target.value)}
                placeholder="Collection name..."
                autoFocus
                style={{
                  flex: 1, padding: '0.6rem 0.75rem', borderRadius: '8px',
                  border: '1px solid var(--color-accent)',
                  backgroundColor: 'var(--color-bg-secondary)',
                  color: 'var(--color-text-primary)',
                  fontSize: '0.9rem',
                }}
              />
              <button
                onClick={() => { setShowNewCollection(false); setNewCollectionName(''); }}
                style={{
                  padding: '0.6rem 0.75rem', borderRadius: '8px',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-bg-secondary)',
                  color: 'var(--color-text-muted)',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <p style={{ color: '#ef4444', fontSize: '0.875rem', marginBottom: '1rem' }}>{error}</p>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '0.6rem 1.25rem', borderRadius: '8px',
              border: '1px solid var(--color-border)',
              backgroundColor: 'transparent',
              color: 'var(--color-text-secondary)',
              cursor: 'pointer', fontSize: '0.9rem',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !front.trim() || !back.trim()}
            style={{
              padding: '0.6rem 1.5rem', borderRadius: '8px',
              border: 'none',
              backgroundColor: saving ? '#9ca3af' : 'var(--color-accent)',
              color: 'white',
              cursor: saving ? 'not-allowed' : 'pointer',
              fontSize: '0.9rem', fontWeight: 600,
            }}
          >
            {saving ? 'Saving…' : '💾 Save Card'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FlashcardCreateModal;
