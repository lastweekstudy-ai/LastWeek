import React, { useState, useEffect } from 'react';
import { getPublishedReviews } from '../appwrite/admin';

/**
 * ReviewList - Display published reviews on landing page
 */
const ReviewList = ({ limit = 6 }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReviews();
  }, [limit]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const published = await getPublishedReviews(limit);
      setReviews(published);
    } catch (err) {
      console.error('[ReviewList] Failed to load:', err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <div style={{ color: 'var(--color-text-muted)' }}>Loading reviews...</div>
      </div>
    );
  }

  if (reviews.length === 0) {
    return null;
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      gap: '1rem',
    }}>
      {reviews.map((review) => (
        <div
          key={review.$id}
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            borderRadius: '12px',
            border: '1px solid var(--color-border)',
            padding: '1.25rem',
          }}
        >
          {/* Rating Stars */}
          <div style={{ display: 'flex', gap: '0.125rem', marginBottom: '0.75rem' }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <span key={star} style={{ fontSize: '0.9rem' }}>
                {star <= review.rating ? '⭐' : '☆'}
              </span>
            ))}
          </div>

          {/* Title */}
          <h4 style={{
            color: 'var(--color-text-primary)',
            margin: '0 0 0.5rem',
            fontSize: '0.95rem',
            fontWeight: 600,
          }}>
            {review.title}
          </h4>

          {/* Content */}
          <p style={{
            color: 'var(--color-text-secondary)',
            margin: '0 0 0.75rem',
            fontSize: '0.85rem',
            lineHeight: 1.5,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {review.content}
          </p>

          {/* Date */}
          <div style={{
            color: 'var(--color-text-muted)',
            fontSize: '0.75rem',
          }}>
            {new Date(review.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ReviewList;
