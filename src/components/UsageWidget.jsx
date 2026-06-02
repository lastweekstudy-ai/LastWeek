import React from 'react';
import { useNavigate } from 'react-router-dom';
import useCombinedLimits from '../hooks/useCombinedLimits';
import { formatLimit } from '../config/planLimits';

/**
 * UsageWidget — Shows live monthly usage progress bars in the dashboard.
 * Displays sessions, messages, PDFs, audios, flashcards and MCQs.
 */
const UsageWidget = () => {
  const navigate = useNavigate();
  const { plan, planName, limits, usage, loading, isTestingMode } = useCombinedLimits();

  if (loading || !usage) return null;

  // Build rows — only show the ones that have a finite limit
  const rows = [
    { label: 'Sessions', current: usage.sessionsCreated || 0, limit: limits.sessions, icon: '📅' },
    { label: 'AI Messages', current: usage.messagesUsed || 0, limit: limits.messages, icon: '💬' },
    { label: 'PDF Uploads', current: usage.pdfsUploaded || 0, limit: limits.pdfs, icon: '📄' },
    { label: 'Audio Uploads', current: usage.audiosUploaded || 0, limit: limits.audios, icon: '🎙️' },
    { label: 'Flashcards', current: usage.flashcardsCreated || 0, limit: limits.flashcards, icon: '🃏' },
    { label: 'MCQs', current: usage.mcqsAnswered || 0, limit: limits.mcqs, icon: '✅' },
  ].filter(row => row.limit !== Infinity); // hide unlimited rows

  if (rows.length === 0) {
    // Pro+ user — all unlimited
    return (
      <div style={{
        backgroundColor: 'var(--color-bg-secondary)',
        borderRadius: '12px',
        border: '1px solid var(--color-border)',
        padding: '1rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.25rem' }}>🚀</span>
          <div>
            <p style={{ margin: 0, fontWeight: 600, color: 'var(--color-text-primary)', fontSize: '0.9rem' }}>
              {planName} — Unlimited everything
            </p>
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
              No limits on any feature this month
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate('/pricing')}
          style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', fontSize: '0.8rem', cursor: 'pointer' }}
        >
          Manage →
        </button>
      </div>
    );
  }

  const month = new Date().toLocaleString('default', { month: 'long' });

  return (
    <div style={{
      backgroundColor: 'var(--color-bg-secondary)',
      borderRadius: '12px',
      border: '1px solid var(--color-border)',
      padding: '1rem 1.25rem',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1rem' }}>📊</span>
          <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>
            {month} Usage
          </span>
          <span style={{
            fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.5rem',
            borderRadius: '999px', backgroundColor: 'rgba(var(--color-accent-rgb),0.1)', color: 'var(--color-accent)',
          }}>
            {planName}
          </span>
        </div>
        <button
          onClick={() => navigate('/pricing')}
          style={{ background: 'none', border: 'none', color: 'var(--color-accent)', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600 }}
        >
          Upgrade →
        </button>
      </div>

      {/* Progress rows */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.6rem' }}>
        {rows.map(({ label, current, limit, icon }) => {
          const pct = Math.min(100, (current / limit) * 100);
          const isNear = pct >= 80;
          const isFull = pct >= 100;
          const color = isFull ? '#ef4444' : isNear ? '#f59e0b' : 'var(--color-accent)';

          return (
            <div key={label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '3px' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>
                  {icon} {label}
                </span>
                <span style={{ color: isFull ? '#ef4444' : 'var(--color-text-muted)', fontWeight: isFull ? 700 : 400 }}>
                  {current}/{formatLimit(limit)}
                </span>
              </div>
              <div style={{ height: '5px', backgroundColor: 'var(--color-bg-tertiary)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${pct}%`,
                  backgroundColor: color,
                  borderRadius: '3px',
                  transition: 'width 0.4s ease',
                }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* "Resets in X days" footer */}
      <p style={{ margin: '0.6rem 0 0', fontSize: '0.72rem', color: 'var(--color-text-muted)', textAlign: 'right' }}>
        Resets {new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
      </p>
    </div>
  );
};

export default UsageWidget;
