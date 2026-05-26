import React, { useState } from 'react';
import ReviewForm from './ReviewForm';
import { useAuth } from '../context/AuthContext';

/**
 * TestingReviewPrompt - Shows on dashboard for testing users
 * Prompts them to submit a review to get Plus for 1 year
 */
const TestingReviewPrompt = ({ onSubmitSuccess }) => {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);

  if (showForm) {
    return (
      <ReviewForm
        userId={user.$id}
        email={user.email}
        name={user.name}
        onSubmitted={(review) => {
          setShowForm(false);
          if (onSubmitSuccess) {
            onSubmitSuccess(review);
          }
        }}
        onClose={() => setShowForm(false)}
      />
    );
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%)',
      border: '1px solid rgba(16, 185, 129, 0.5)',
      borderRadius: '12px',
      padding: '1.25rem',
      marginBottom: '1.5rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
        <div style={{ fontSize: '2rem' }}>🎁</div>
        <div style={{ flex: 1 }}>
          <h4 style={{ color: '#10b981', margin: '0 0 0.5rem', fontSize: '1rem' }}>
            You're in Testing Mode!
          </h4>
          <p style={{ color: 'var(--color-text-secondary)', margin: '0 0 0.75rem', fontSize: '0.85rem' }}>
            Test all features once. When you're done, leave a review and get{' '}
            <strong style={{ color: '#10b981' }}>Plus free for 1 year</strong>!
          </p>
          <button
            onClick={() => setShowForm(true)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: '#10b981',
              color: 'white',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem',
            }}
          >
            Leave a Review
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestingReviewPrompt;
