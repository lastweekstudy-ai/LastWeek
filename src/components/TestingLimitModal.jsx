import React from 'react';
import { getFeatureName, getFeatureDescription, formatTestingLimit } from '../config/testingLimits';

/**
 * TestingLimitModal - Shows when a testing user hits their one-time limit
 */
const TestingLimitModal = ({ 
  isOpen, 
  onClose, 
  feature, 
  currentUsage, 
  limit,
  onReview,
}) => {
  if (!isOpen) return null;

  const featureName = getFeatureName(feature);
  const featureDesc = getFeatureDescription(feature);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem',
    }}>
      <div style={{
        backgroundColor: 'var(--color-bg-secondary)',
        borderRadius: '16px',
        border: '1px solid var(--color-border)',
        padding: '2rem',
        maxWidth: '420px',
        width: '100%',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>⚠️</div>
          <h3 style={{ color: 'var(--color-text-primary)', margin: '0 0 0.5rem', fontSize: '1.25rem' }}>
            Testing Limit Reached
          </h3>
          <p style={{ color: 'var(--color-text-secondary)', margin: 0, fontSize: '0.9rem' }}>
            You've used your {featureName.toLowerCase()} for testing.
          </p>
        </div>

        {/* Limit info */}
        <div style={{
          backgroundColor: 'var(--color-bg-primary)',
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '1.5rem',
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            marginBottom: '0.5rem',
          }}>
            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
              Feature
            </span>
            <span style={{ color: 'var(--color-text-primary)', fontSize: '0.85rem', fontWeight: 600 }}>
              {featureName}
            </span>
          </div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
          }}>
            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
              Your Limit
            </span>
            <span style={{ color: 'var(--color-text-primary)', fontSize: '0.85rem', fontWeight: 600 }}>
              {formatTestingLimit(limit)} (used {currentUsage})
            </span>
          </div>
        </div>

        {/* Review prompt */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.5)',
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '1.5rem',
        }}>
          <h4 style={{ color: '#10b981', margin: '0 0 0.5rem', fontSize: '0.95rem' }}>
            🎁 Want unlimited access?
          </h4>
          <p style={{ color: 'var(--color-text-secondary)', margin: 0, fontSize: '0.85rem' }}>
            Submit a review of your experience and get <strong style={{ color: '#10b981' }}>Plus free for 1 year</strong> when pre-registration ends!
          </p>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '0.75rem',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
              backgroundColor: 'transparent',
              color: 'var(--color-text-secondary)',
              cursor: 'pointer',
              fontSize: '0.9rem',
            }}
          >
            Close
          </button>
          <button
            onClick={onReview}
            style={{
              flex: 2,
              padding: '0.75rem',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#10b981',
              color: 'white',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.9rem',
            }}
          >
            Leave a Review
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestingLimitModal;
