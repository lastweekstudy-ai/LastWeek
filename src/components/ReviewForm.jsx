import React, { useState } from 'react';
import { createReview, markTestingUserReviewed, getPreRegistrationByUserId } from '../appwrite/admin';

/**
 * ReviewForm - For testing users to submit their review
 * After submission, they're added to pre-registration list
 */
const ReviewForm = ({ userId, email, name, onSubmitted, onClose }) => {
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError('Please add a title for your review');
      return;
    }
    if (!content.trim() || content.length < 20) {
      setError('Please write at least 20 characters for your review');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Create the review
      const review = await createReview({
        userId,
        userName: name || 'Anonymous',
        rating,
        title: title.trim(),
        content: content.trim(),
      });

      // Mark testing user as reviewed and add to pre-reg
      const preReg = await markTestingUserReviewed(userId, review.$id);
      
      // Get the promo code from the pre-registration
      if (preReg?.promoCode) {
        setPromoCode(preReg.promoCode);
      } else {
        // Fallback: fetch the pre-reg to get the promo code
        const fetchedPreReg = await getPreRegistrationByUserId(userId);
        if (fetchedPreReg?.promoCode) {
          setPromoCode(fetchedPreReg.promoCode);
        }
      }

      setSuccess(true);
      
      // Notify parent
      if (onSubmitted) {
        setTimeout(() => {
          onSubmitted(review);
        }, 3000);
      }
    } catch (err) {
      console.error('[ReviewForm] Failed to submit:', err.message);
      setError('Failed to submit review. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyPromoCode = async () => {
    if (promoCode) {
      await navigator.clipboard.writeText(promoCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (success) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%)',
        border: '1px solid #10b981',
        borderRadius: '16px',
        padding: '2rem',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
        <h3 style={{ color: '#10b981', margin: '0 0 0.5rem', fontSize: '1.25rem' }}>
          Thank You for Your Review!
        </h3>
        <p style={{ color: 'var(--color-text-secondary)', margin: '0 0 1rem' }}>
          You've been added to our pre-registration list and get <strong style={{ color: '#a855f7' }}>Plus free for 1 year</strong>!
        </p>
        
        {promoCode && (
          <div style={{
            backgroundColor: 'var(--color-bg-primary)',
            borderRadius: '10px',
            padding: '1rem',
            marginBottom: '1rem',
          }}>
            <label style={{
              display: 'block',
              color: 'var(--color-text-muted)',
              fontSize: '0.75rem',
              marginBottom: '0.5rem',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}>
              Your Promo Code
            </label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
            }}>
              <code style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color: '#a855f7',
                letterSpacing: '2px',
              }}>
                {promoCode}
              </code>
              <button
                onClick={copyPromoCode}
                style={{
                  padding: '0.4rem 0.75rem',
                  borderRadius: '6px',
                  border: '1px solid var(--color-border)',
                  backgroundColor: copied ? 'rgba(16, 185, 129, 0.2)' : 'var(--color-bg-secondary)',
                  color: copied ? '#10b981' : 'var(--color-text-secondary)',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: 500,
                }}
              >
                {copied ? '✓ Copied!' : 'Copy'}
              </button>
            </div>
            <p style={{
              color: 'var(--color-text-muted)',
              fontSize: '0.75rem',
              margin: '0.5rem 0 0',
            }}>
              Share with friends! Every 10 friends who join = +6 months free for you.
            </p>
          </div>
        )}
        
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', margin: 0 }}>
          Check your dashboard for your pre-registration status.
        </p>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: 'var(--color-bg-secondary)',
      borderRadius: '16px',
      border: '1px solid var(--color-border)',
      padding: '1.5rem',
    }}>
      <h3 style={{ color: 'var(--color-text-primary)', margin: '0 0 0.5rem', fontSize: '1.1rem' }}>
        📝 Leave a Review
      </h3>
      <p style={{ color: 'var(--color-text-secondary)', margin: '0 0 1.5rem', fontSize: '0.85rem' }}>
        Share your experience and get <strong style={{ color: '#a855f7' }}>Plus free for 1 year</strong>!
      </p>

      <form onSubmit={handleSubmit}>
        {/* Star Rating */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ 
            display: 'block', 
            color: 'var(--color-text-secondary)', 
            marginBottom: '0.5rem',
            fontSize: '0.85rem',
          }}>
            Rating *
          </label>
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1.5rem',
                  padding: '0.25rem',
                }}
              >
                {star <= rating ? '⭐' : '☆'}
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ 
            display: 'block', 
            color: 'var(--color-text-secondary)', 
            marginBottom: '0.5rem',
            fontSize: '0.85rem',
          }}>
            Review Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Summarize your experience"
            maxLength={100}
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-bg-primary)',
              color: 'var(--color-text-primary)',
              fontSize: '0.9rem',
            }}
          />
        </div>

        {/* Content */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ 
            display: 'block', 
            color: 'var(--color-text-secondary)', 
            marginBottom: '0.5rem',
            fontSize: '0.85rem',
          }}>
            Your Review *
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What did you like? What could be improved?"
            rows={4}
            maxLength={1000}
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-bg-primary)',
              color: 'var(--color-text-primary)',
              fontSize: '0.9rem',
              resize: 'vertical',
            }}
          />
          <div style={{ 
            textAlign: 'right', 
            color: 'var(--color-text-muted)', 
            fontSize: '0.75rem',
            marginTop: '0.25rem',
          }}>
            {content.length}/1000
          </div>
        </div>

        {error && (
          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid #ef4444',
            borderRadius: '8px',
            padding: '0.75rem',
            marginBottom: '1rem',
            color: '#ef4444',
            fontSize: '0.85rem',
          }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                flex: 1,
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                backgroundColor: 'transparent',
                color: 'var(--color-text-secondary)',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '0.9rem',
              }}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            style={{
              flex: 2,
              padding: '0.75rem',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#10b981',
              color: 'white',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              fontSize: '0.9rem',
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReviewForm;
