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
  const [selectedCollection, setSelectedCollection] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);
  const [reviewQueue, setReviewQueue] = useState([]);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [newCollectionName, setNewCollectionName] = useState('');
  const [showNewCollectionInput, setShowNewCollectionInput] = useState(false);
  const [movingCard, setMovingCard] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
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
      setAllCards(prev => prev.map(c =>
        c.$id === card.$id ? { ...c, confidence, nextReviewAt: nextDate.toISOString() } : c
      ));
    } catch (err) {
      console.error('Failed to update flashcard:', err);
    }
    if (reviewIndex + 1 >= reviewQueue.length) {
      setReviewMode(false);
      loadData();
    } else {
      setReviewIndex(i => i + 1);
    }
  };

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
    setMovingCard(cardId);
    try {
      await moveFlashcardToCollection(cardId, collectionId);
      setAllCards(prev => prev.map(c =>
        c.$id === cardId ? { ...c, collectionId: collectionId || null } : c
      ));
    } catch (err) {
      setError('Failed to move card: ' + err.message);
    } finally {
      setMovingCard(null);
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

  if (reviewMode) {
    const card = reviewQueue[reviewIndex];
    return (
      <div className="flashcard-review-page">
        <div className="flashcard-review-shell">
          <div className="flashcard-review-header">
            <button onClick={() => setReviewMode(false)} className="flashcard-review-exit">
              Exit Review
            </button>
            <span className="flashcard-review-count">
              {reviewIndex + 1} / {reviewQueue.length}
            </span>
          </div>
          <div className="flashcard-review-progress">
            <div style={{ width: `${(reviewIndex / reviewQueue.length) * 100}%` }} />
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
    <div className="flashcard-library-page">
      <div className="flashcard-library-shell">
        <div className="flashcard-library-header">
          <div>
            <h1>Flashcard Library</h1>
            <p>{allCards.length} cards total · {dueCount} due for review</p>
          </div>
          <div className="flashcard-library-actions">
            {dueCount > 0 && (
              <button
                onClick={() => { setSelectedCollection('due'); startReview(); }}
                className="btn btn-primary"
              >
                Review {dueCount} Due
              </button>
            )}
            <button onClick={() => setShowCreateModal(true)} className="btn btn-secondary">
              + New Card
            </button>
          </div>
        </div>

        {error && <div className="flashcard-error">{error}</div>}

        <div className="flashcard-library-layout">
          <aside className="flashcard-collections">
            <div className="flashcard-collection-panel">
              <div className="flashcard-panel-title">Collections</div>

              {[
                { id: 'all', label: 'All Cards', count: allCards.length },
                { id: 'due', label: 'Due Today', count: dueCount },
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setSelectedCollection(item.id)}
                  className={`flashcard-collection-item ${selectedCollection === item.id ? 'active' : ''}`}
                >
                  <span>{item.label}</span>
                  <span>{item.count}</span>
                </button>
              ))}

              {collections.map(col => {
                const count = allCards.filter(c => c.collectionId === col.$id).length;
                return (
                  <div key={col.$id} className="flashcard-collection-row">
                    <button
                      onClick={() => setSelectedCollection(col.$id)}
                      className={`flashcard-collection-item ${selectedCollection === col.$id ? 'active' : ''}`}
                    >
                      <span>{col.name}</span>
                      <span>{count}</span>
                    </button>
                    <button
                      onClick={() => handleDeleteCollection(col.$id)}
                      title="Delete collection"
                      className="flashcard-delete-collection"
                    >
                      ×
                    </button>
                  </div>
                );
              })}

              <div className="flashcard-new-collection">
                {showNewCollectionInput ? (
                  <div className="flashcard-new-collection-form">
                    <input
                      type="text"
                      value={newCollectionName}
                      onChange={e => setNewCollectionName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleCreateCollection()}
                      placeholder="Name..."
                      autoFocus
                    />
                    <button onClick={handleCreateCollection}>Save</button>
                    <button onClick={() => { setShowNewCollectionInput(false); setNewCollectionName(''); }}>
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowNewCollectionInput(true)}
                    className="flashcard-new-collection-trigger"
                  >
                    + New collection
                  </button>
                )}
              </div>
            </div>

            {cards.length > 0 && (
              <button onClick={startReview} className="flashcard-review-filter">
                Review These ({cards.length})
              </button>
            )}
          </aside>

          <main className="flashcard-library-main">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search cards..."
              className="flashcard-search"
            />

            {loading ? (
              <div className="flashcard-library-loading">Loading flashcards...</div>
            ) : cards.length === 0 ? (
              <div className="flashcard-library-empty">
                <div>Flashcards</div>
                <p>
                  {selectedCollection === 'due'
                    ? 'No cards due for review right now!'
                    : 'No flashcards here yet.'}
                </p>
                <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
                  + Create your first card
                </button>
              </div>
            ) : (
              <div className="flashcard-card-grid">
                {cards.map(card => {
                  const isDue = new Date(card.nextReviewAt) <= new Date();
                  const col = collections.find(c => c.$id === card.collectionId);
                  return (
                    <div key={card.$id} className={`flashcard-library-card ${isDue ? 'is-due' : ''}`}>
                      {isDue && <span className="flashcard-due-badge">DUE</span>}

                      <p className="flashcard-card-front">{card.front}</p>
                      <p className="flashcard-card-back">{card.back}</p>

                      <div className="flashcard-card-meta">
                        <div className="flashcard-card-tags">
                          <span
                            className="flashcard-confidence-chip"
                            style={{
                              backgroundColor: `${CONFIDENCE_COLORS[card.confidence || 0]}20`,
                              color: CONFIDENCE_COLORS[card.confidence || 0],
                            }}
                          >
                            {CONFIDENCE_LABELS[card.confidence || 0]}
                          </span>
                          {col && <span className="flashcard-card-chip">{col.name}</span>}
                          {card.source && card.source !== 'ai' && (
                            <span className="flashcard-card-chip">
                              {card.source === 'manual' ? 'Manual' : card.source === 'language' ? 'Language' : 'Imported'}
                            </span>
                          )}
                        </div>

                        <div className="flashcard-card-actions">
                          <select
                            value={card.collectionId || ''}
                            onChange={e => handleMoveCard(card.$id, e.target.value || null)}
                            title="Move to collection"
                            disabled={movingCard === card.$id}
                          >
                            <option value="">No collection</option>
                            {collections.map(c => (
                              <option key={c.$id} value={c.$id}>{c.name}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleDeleteCard(card.$id)}
                            title="Delete card"
                            className="flashcard-card-delete"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </main>
        </div>
      </div>

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
