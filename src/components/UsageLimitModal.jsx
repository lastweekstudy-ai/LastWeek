import React from 'react';
import { useNavigate } from 'react-router-dom';
import { formatLimit } from '../config/planLimits';

/**
 * UsageLimitModal — shown when a user hits a usage limit.
 * Displays what they've used, what the limit is, and a CTA to upgrade.
 *
 * Props:
 *   isOpen    {boolean}
 *   onClose   {function}
 *   action    {string}   — what they tried to do ('sessions', 'messages', 'pdfs', etc.)
 *   current   {number}   — how many they've used this month
 *   limit     {number}   — their plan's limit
 *   planName  {string}   — their current plan name
 */
const UsageLimitModal = ({ isOpen, onClose, action, current, limit, planName }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const actionLabels = {
    sessions: 'study sessions',
    messages: 'AI messages',
    pdfs: 'PDF uploads',
    audios: 'audio uploads',
    flashcards: 'flashcards',
    mcqs: 'quiz questions',
    tts: 'text-to-speech plays',
    examPlans: 'exam plans',
    languageLearning: 'language learning',
  };

  const label = actionLabels[action] || action;
  const isFeatureLocked = action === 'languageLearning';

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          borderRadius: '16px',
          padding: '2rem',
          maxWidth: '420px',
          width: '90%',
          textAlign: 'center',
          border: '1px solid var(--color-border)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Icon */}
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
          {isFeatureLocked ? '🔒' : '⚡'}
        </div>

        {/* Title */}
        <h2 style={{
          margin: '0 0 0.5rem',
          fontSize: '1.25rem',
          fontWeight: 700,
          color: 'var(--color-text-primary)',
        }}>
          {isFeatureLocked ? 'Feature Locked' : 'Monthly Limit Reached'}
        </h2>

        {/* Description */}
        <p style={{
          margin: '0 0 1.5rem',
          fontSize: '0.9rem',
          color: 'var(--color-text-secondary)',
          lineHeight: 1.5,
        }}>
          {isFeatureLocked ? (
            <>Language Learning is available on <strong>Pro</strong> and above.</>
          ) : (
            <>
              You've used <strong>{current}</strong> of your <strong>{formatLimit(limit)}</strong> monthly {label} on the <strong>{planName}</strong> plan.
              <br />
              Upgrade to get more.
            </>
          )}
        </p>

        {/* Usage bar (only for countable limits) */}
        {!isFeatureLocked && limit !== Infinity && (
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{
              height: '8px',
              backgroundColor: 'var(--color-bg-tertiary)',
              borderRadius: '4px',
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                width: '100%',
                backgroundColor: '#ef4444',
                borderRadius: '4px',
              }} />
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.4rem' }}>
              {current} / {formatLimit(limit)} used this month
            </p>
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <button
            onClick={onClose}
            style={{
              padding: '0.6rem 1.25rem',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
              backgroundColor: 'transparent',
              color: 'var(--color-text-secondary)',
              cursor: 'pointer',
              fontSize: '0.9rem',
            }}
          >
            Maybe Later
          </button>
          <button
            onClick={() => { onClose(); navigate('/pricing'); }}
            style={{
              padding: '0.6rem 1.25rem',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#a855f7',
              color: 'white',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.9rem',
            }}
          >
            Upgrade Now →
          </button>
        </div>
      </div>
    </div>
  );
};

export default UsageLimitModal;
