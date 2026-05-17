import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getUserFlashcards,
  getDueFlashcards,
  getUserFlashcardCollections,
  createFlashcardCollection,
  deleteFlashcardCollection,
  moveFlashcardToCollection,
  deleteFlashcard,
  updateFlashcard,
} from '../appwrite/database';
import { getNextReviewDate } from '../utils/spacedRepetition';
import FlashcardCreateModal from '../components/FlashcardCreateModal';
import Flashcard from '../components/Flashcard';

const CONFIDENCE_LABELS = { 0: 'New', 1: 'Hard', 2: 'Okay', 3: 'Easy' };
const CONFIDENCE_COLORS = { 0: '#6b7280', 1: '#ef4444', 2: '#f59e0b', 3: '#10b981' };

const FlashcardLibrary = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [allCards, setAllCards] = useState([]);
  const [dueCards, setDueCards] = useState([]);
  const [collections, setCollections] = useState([]);
  const [selectedCollection, setSelectedCollection] = useState('all'); // 'all' | 'due' | collectionId
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);
  const [reviewQueue, setReviewQueue] = useState([]);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [newCollectionName, setNewCollectionName] = useState('');
  const [showNewCollectionInput, setShowNewCollectionInput] = useState(false);
  const [movingCard, setMovingCard] = useState(null); // cardId being moved

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cards, due, cols] = await Promise.all([
        getUserFlashcards(user.$id),
        getDueFlashcards(user.$id),
        getUserFlashcardCollections(user.$id),
      ]);
      setAllCards(cards);
      setDueCards(due);
      setCollections(cols);
    } catch (err) {
      setError('Failed to load flashcards: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Filtered cards ────────────────────────────────────────────────────────
  const filteredCards = useCallback(() => {
    let cards = allCards;
    if (selectedCollection === 'due') {
      cards = dueCards;
    } else if (selectedCollection !== 'all') {
      cards = allCards.filter(c => c.collectionId === selectedCollection);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      cards = cards.filter(c =>
        c.front?.toLowerCase().includes(q) || c.back?.toLowerCase().includes(q)
      );
    }
    return cards;
  }, [allCards, dueCards, selectedCollection, searchQuery]);

  // ── Review mode ───────────────────────────────────────────────────────────
  const startReview = () => {
    const cards = selectedCollection === 'due' ? dueCards : filteredCards();
    if (cards.length === 0) return;
    setReviewQueue([...cards].sort(() => Math.random() - 0.5));
    setReviewIndex(0);
    setReviewMode(true);
  };

  const handleReviewRate = async (confidence) => {
    const card = reviewQueue[reviewIndex];
    if (!card) return;
    try {
      const nextDate = getNextReviewDate(confidence);
      await updateFlashcard(card.$id, confidence, nextDate);
      // Update local state
      setAllCards(prev => prev.map(c =>
        c.$id === card.$id ? { ...c, confidence, nextReviewAt: nextDate.toISOString() } : c
      ));
    } catch (err) {
      console.error('Failed to update flashcard:', err);
    }
    if (reviewIndex + 1 >= reviewQueue.length) {
      setReviewMode(false);
      loadData(); // Refresh after review session
    } else {
      setReviewIndex(i => i + 1);
    }
  };

  // ── Collection management ─────────────────────────────────────────────────
  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) return;
    try {
      const col = await createFlashcardCollection(user.$id, newCollectionName.trim());
      setCollections(prev => [...prev, col]);
      setNewCollectionName('');
      setShowNewCollectionInput(false);
    } catch (err) {
      setError('Failed to create collection: ' + err.message);
    }
  };

  const handleDeleteCollection = async (colId) => {
    if (!window.confirm('Delete this collection? Cards inside will not be deleted.')) return;
    try {
      await deleteFlashcardCollection(colId);
      setCollections(prev => prev.filter(c => c.$id !== colId));
      if (selectedCollection === colId) setSelectedCollection('all');
    } catch (err) {
      setError('Failed to delete collection: ' + err.message);
    }
  };

  const handleMoveCard = async (cardId, collectionId) => {
    try {
      await moveFlashcardToCollection(cardId, collectionId);
      setAllCards(prev => prev.map(c =>
        c.$id === cardId ? { ...c, collectionId: collectionId || null } : c
      ));
      setMovingCard(null);
    } catch (err) {
      setError('Failed to move card: ' + err.message);
    }
  };

  const handleDeleteCard = async (cardId) => {
    if (!window.confirm('Delete this flashcard?')) return;
    try {
      await deleteFlashcard(cardId);
      setAllCards(prev => prev.filter(c => c.$id !== cardId));
      setDueCards(prev => prev.filter(c => c.$id !== cardId));
    } catch (err) {
      setError('Failed to delete card: ' + err.message);
    }
  };

  // ── Review mode UI ────────────────────────────────────────────────────────
  if (reviewMode) {
    const card = reviewQueue[reviewIndex];
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-bg-primary)', padding: '2rem 1rem' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <button
              onClick={() => setReviewMode(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}
            >
              ← Exit Review
            </button>
            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
              {reviewIndex + 1} / {reviewQueue.length}
            </span>
          </div>

          {/* Progress bar */}
          <div style={{ height: '4px', backgroundColor: 'var(--color-border)', borderRadius: '2px', marginBottom: '2rem' }}>
            <div style={{
              height: '100%', borderRadius: '2px', backgroundColor: '#a855f7',
              width: `${((reviewIndex) / reviewQueue.length) * 100}%`,
              transition: 'width 0.3s ease',
            }} />
          </div>

          <Flashcard
            front={card.front}
            back={card.back}
            onRate={handleReviewRate}
            isReview={true}
          />
        </div>
      </div>
    );
  }

  const cards = filteredCards();
  const dueCount = dueCards.length;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-bg-primary)' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 1rem' }}>

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              🃏 Flashcard Library
            </h1>
            <p style={{ margin: '0.25rem 0 0', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
              {allCards.length} cards total · {dueCount} due for review
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {dueCount > 0 && (
              <button
                onClick={() => { setSelectedCollection('due'); startReview(); }}
                style={{
                  padding: '0.6rem 1.25rem', borderRadius: '8px', border: 'none',
                  backgroundColor: '#a855f7', color: 'white',
                  cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem',
                }}
              >
                📚 Review {dueCount} Due
              </button>
            )}
            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                padding: '0.6rem 1.25rem', borderRadius: '8px',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-bg-secondary)',
                color: 'var(--color-text-primary)',
                cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem',
              }}
            >
              + New Card
            </button>
          </div>
        </div>

        {error && (
          <div style={{ padding: '0.75rem 1rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626', marginBottom: '1rem', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>

          {/* ── Sidebar: Collections ──────────────────────────────────────── */}
          <div style={{ width: '220px', flexShrink: 0 }}>
            <div style={{ backgroundColor: 'var(--color-bg-secondary)', borderRadius: '12px', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
              <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--color-border)', fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Collections
              </div>

              {/* All / Due */}
              {[
                { id: 'all', label: `All Cards`, count: allCards.length, icon: '📋' },
                { id: 'due', label: `Due Today`, count: dueCount, icon: '⏰' },
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setSelectedCollection(item.id)}
                  style={{
                    width: '100%', textAlign: 'left', padding: '0.65rem 1rem',
                    border: 'none', cursor: 'pointer',
                    backgroundColor: selectedCollection === item.id ? 'rgba(168,85,247,0.1)' : 'transparent',
                    color: selectedCollection === item.id ? '#a855f7' : 'var(--color-text-primary)',
                    fontWeight: selectedCollection === item.id ? 600 : 400,
                    fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}
                >
                  <span>{item.icon} {item.label}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{item.count}</span>
                </button>
              ))}

              {/* User collections */}
              {collections.map(col => {
                const count = allCards.filter(c => c.collectionId === col.$id).length;
                return (
                  <div key={col.$id} style={{ display: 'flex', alignItems: 'center' }}>
                    <button
                      onClick={() => setSelectedCollection(col.$id)}
                      style={{
                        flex: 1, textAlign: 'left', padding: '0.65rem 1rem',
                        border: 'none', cursor: 'pointer',
                        backgroundColor: selectedCollection === col.$id ? 'rgba(168,85,247,0.1)' : 'transparent',
                        color: selectedCollection === col.$id ? '#a855f7' : 'var(--color-text-primary)',
                        fontWeight: selectedCollection === col.$id ? 600 : 400,
                        fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      }}
                    >
                      <span>{col.icon || '📚'} {col.name}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{count}</span>
                    </button>
                    <button
                      onClick={() => handleDeleteCollection(col.$id)}
                      title="Delete collection"
                      style={{ padding: '0.5rem 0.6rem', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: '0.75rem' }}
                    >
                      ✕
                    </button>
                  </div>
                );
              })}

              {/* New collection */}
              <div style={{ padding: '0.5rem', borderTop: '1px solid var(--color-border)' }}>
                {showNewCollectionInput ? (
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <input
                      type="text"
                      value={newCollectionName}
                      onChange={e => setNewCollectionName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleCreateCollection()}
                      placeholder="Name..."
                      autoFocus
                      style={{
                        flex: 1, padding: '0.4rem 0.5rem', borderRadius: '6px',
                        border: '1px solid var(--color-accent)',
                        backgroundColor: 'var(--color-bg-primary)',
                        color: 'var(--color-text-primary)', fontSize: '0.85rem',
                      }}
                    />
                    <button onClick={handleCreateCollection} style={{ padding: '0.4rem 0.6rem', borderRadius: '6px', border: 'none', backgroundColor: '#a855f7', color: 'white', cursor: 'pointer', fontSize: '0.8rem' }}>✓</button>
                    <button onClick={() => { setShowNewCollectionInput(false); setNewCollectionName(''); }} style={{ padding: '0.4rem 0.5rem', borderRadius: '6px', border: 'none', backgroundColor: 'transparent', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: '0.8rem' }}>✕</button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowNewCollectionInput(true)}
                    style={{ width: '100%', padding: '0.5rem', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: '0.85rem', textAlign: 'left' }}
                  >
                    + New collection
                  </button>
                )}
              </div>
            </div>

            {/* Review button for current filter */}
            {cards.length > 0 && (
              <button
                onClick={startReview}
                style={{
                  width: '100%', marginTop: '0.75rem', padding: '0.65rem',
                  borderRadius: '8px', border: '1px solid #a855f7',
                  backgroundColor: 'transparent', color: '#a855f7',
                  cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem',
                }}
              >
                ▶ Review These ({cards.length})
              </button>
            )}
          </div>

          {/* ── Main: Card Grid ───────────────────────────────────────────── */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Search */}
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search cards..."
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '0.65rem 1rem', borderRadius: '8px',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-bg-secondary)',
                color: 'var(--color-text-primary)',
                fontSize: '0.9rem', marginBottom: '1rem',
              }}
            />

            {loading ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                Loading flashcards…
              </div>
            ) : cards.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '3rem',
                backgroundColor: 'var(--color-bg-secondary)',
                borderRadius: '12px', border: '1px solid var(--color-border)',
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🃏</div>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                  {selectedCollection === 'due'
                    ? 'No cards due for review right now!'
                    : 'No flashcards here yet.'}
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  style={{
                    padding: '0.6rem 1.25rem', borderRadius: '8px', border: 'none',
                    backgroundColor: '#a855f7', color: 'white',
                    cursor: 'pointer', fontWeight: 600,
                  }}
                >
                  + Create your first card
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                {cards.map(card => {
                  const isDue = new Date(card.nextReviewAt) <= new Date();
                  const col = collections.find(c => c.$id === card.collectionId);
                  return (
                    <div
                      key={card.$id}
                      style={{
                        backgroundColor: 'var(--color-bg-secondary)',
                        borderRadius: '10px',
                        border: `1px solid ${isDue ? '#a855f7' : 'var(--color-border)'}`,
                        padding: '1rem',
                        position: 'relative',
                      }}
                    >
                      {/* Due badge */}
                      {isDue && (
                        <span style={{
                          position: 'absolute', top: '0.6rem', right: '0.6rem',
                          backgroundColor: '#a855f7', color: 'white',
                          fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.5rem',
                          borderRadius: '999px',
                        }}>
                          DUE
                        </span>
                      )}

                      {/* Front */}
                      <p style={{
                        margin: '0 0 0.5rem', fontWeight: 600,
                        color: 'var(--color-text-primary)', fontSize: '0.9rem',
                        overflow: 'hidden', display: '-webkit-box',
                        WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                      }}>
                        {card.front}
                      </p>

                      {/* Back preview */}
                      <p style={{
                        margin: '0 0 0.75rem', color: 'var(--color-text-muted)',
                        fontSize: '0.8rem',
                        overflow: 'hidden', display: '-webkit-box',
                        WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                      }}>
                        {card.back}
                      </p>

                      {/* Meta row */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.4rem' }}>
                        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
                          <span style={{
                            fontSize: '0.72rem', fontWeight: 600, padding: '0.15rem 0.5rem',
                            borderRadius: '999px', backgroundColor: `${CONFIDENCE_COLORS[card.confidence || 0]}20`,
                            color: CONFIDENCE_COLORS[card.confidence || 0],
                          }}>
                            {CONFIDENCE_LABELS[card.confidence || 0]}
                          </span>
                          {col && (
                            <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                              {col.icon} {col.name}
                            </span>
                          )}
                          {card.source && card.source !== 'ai' && (
                            <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                              {card.source === 'manual' ? '✏️' : card.source === 'language' ? '🌐' : '📝'}
                            </span>
                          )}
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                          {/* Move to collection */}
                          <select
                            value={card.collectionId || ''}
                            onChange={e => handleMoveCard(card.$id, e.target.value || null)}
                            title="Move to collection"
                            style={{
                              fontSize: '0.75rem', padding: '0.2rem 0.3rem',
                              borderRadius: '4px', border: '1px solid var(--color-border)',
                              backgroundColor: 'var(--color-bg-tertiary)',
                              color: 'var(--color-text-secondary)', cursor: 'pointer',
                            }}
                          >
                            <option value="">No collection</option>
                            {collections.map(c => (
                              <option key={c.$id} value={c.$id}>{c.icon} {c.name}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleDeleteCard(card.$id)}
                            title="Delete card"
                            style={{
                              padding: '0.2rem 0.4rem', borderRadius: '4px',
                              border: '1px solid var(--color-border)',
                              backgroundColor: 'transparent',
                              color: '#ef4444', cursor: 'pointer', fontSize: '0.75rem',
                            }}
                          >
                            🗑
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Modal */}
      <FlashcardCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        userId={user?.$id}
        sessionId={null}
        subject="General"
        onSaved={(card) => {
          setAllCards(prev => [card, ...prev]);
          loadData();
        }}
      />
    </div>
  );
};

export default FlashcardLibrary;
