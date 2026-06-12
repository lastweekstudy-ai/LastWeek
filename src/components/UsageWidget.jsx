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
      <div className="glass-card flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-lg dark:bg-emerald-500/15">🚀</span>
          <div>
            <p className="text-sm font-semibold text-surface-950 dark:text-white">
              {planName} - Unlimited everything
            </p>
            <p className="text-xs text-surface-500 dark:text-surface-400">
              No limits on any feature this month
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate('/pricing')}
          className="btn-secondary justify-center px-3 py-2 text-xs"
        >
          Manage
        </button>
      </div>
    );
  }

  const month = new Date().toLocaleString('default', { month: 'long' });

  return (
    <div className="glass-card p-4">
      {/* Header */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-100 text-sm dark:bg-brand-500/15">📊</span>
          <span className="text-sm font-semibold text-surface-950 dark:text-white">
            {month} Usage
          </span>
          <span className="badge">
            {planName}
          </span>
        </div>
        <button
          onClick={() => navigate('/pricing')}
          className="btn-secondary justify-center px-3 py-2 text-xs"
        >
          Upgrade
        </button>
      </div>

      {/* Progress rows */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {rows.map(({ label, current, limit, icon }) => {
          const pct = Math.min(100, (current / limit) * 100);
          const isNear = pct >= 80;
          const isFull = pct >= 100;

          return (
            <div key={label} className="rounded-2xl border border-surface-200 bg-white p-3 dark:border-surface-800 dark:bg-surface-900">
              <div className="mb-2 flex justify-between gap-3 text-xs">
                <span className="min-w-0 truncate font-medium text-surface-600 dark:text-surface-300">
                  {icon} {label}
                </span>
                <span className={`shrink-0 font-semibold ${isFull ? 'text-red-500' : 'text-surface-500 dark:text-surface-400'}`}>
                  {current}/{formatLimit(limit)}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-surface-100 dark:bg-surface-800">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${isFull ? 'bg-red-500' : isNear ? 'bg-amber-500' : 'bg-brand-500'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* "Resets in X days" footer */}
      <p className="mt-3 text-right text-xs text-surface-500 dark:text-surface-400">
        Resets {new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
      </p>
    </div>
  );
};

export default UsageWidget;
