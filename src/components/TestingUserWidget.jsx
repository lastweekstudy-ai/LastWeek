import React from 'react';
import { TESTING_LIMITS } from '../config/testingLimits';

/**
 * TestingUserWidget - Shows testing user's usage and limits
 * Displayed in the dashboard for users in testing mode
 */
const TestingUserWidget = ({ usage }) => {
  if (!usage) return null;

  const features = [
    { key: 'sessions', label: 'Sessions', icon: '📚' },
    { key: 'messages', label: 'Messages', icon: '💬' },
    { key: 'pdfs', label: 'PDF Uploads', icon: '📄' },
    { key: 'audios', label: 'Audio Uploads', icon: '🎵' },
    { key: 'flashcards', label: 'Flashcards', icon: '🃏' },
    { key: 'mcqs', label: 'MCQ Quizzes', icon: '❓' },
    { key: 'examPlans', label: 'Exam Plans', icon: '📅' },
    { key: 'languageLearningSessions', label: 'Language Sessions', icon: '🌐' },
  ];

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%)',
      border: '1px solid rgba(16, 185, 129, 0.5)',
      borderRadius: '12px',
      padding: '1.25rem',
      marginBottom: '1.5rem',
    }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginBottom: '1rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.5rem' }}>🎁</span>
          <div>
            <h3 style={{ 
              color: '#10b981', 
              margin: 0, 
              fontSize: '1rem', 
              fontWeight: 600 
            }}>
              Testing Mode
            </h3>
            <p style={{ 
              color: 'var(--color-text-muted)', 
              margin: 0, 
              fontSize: '0.75rem' 
            }}>
              One-time feature access • Leave a review to get Plus free!
            </p>
          </div>
        </div>
      </div>

      {/* Usage Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
        gap: '0.5rem',
      }}>
        {features.map(({ key, label, icon }) => {
          const used = usage[key] || 0;
          const limit = TESTING_LIMITS[key];
          const isUsed = used >= limit;
          const isUnlimited = limit === Infinity;

          return (
            <div
              key={key}
              style={{
                backgroundColor: 'var(--color-bg-primary)',
                borderRadius: '8px',
                padding: '0.5rem',
                textAlign: 'center',
                opacity: isUsed ? 0.6 : 1,
                border: isUsed ? '1px solid #ef4444' : '1px solid transparent',
              }}
            >
              <div style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>{icon}</div>
              <div style={{
                fontSize: '0.85rem',
                fontWeight: 600,
                color: isUsed ? '#ef4444' : 'var(--color-text-primary)',
              }}>
                {isUnlimited ? '∞' : `${used}/${limit}`}
              </div>
              <div style={{
                fontSize: '0.65rem',
                color: 'var(--color-text-muted)',
              }}>
                {label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Library imports note */}
      <div style={{
        marginTop: '0.75rem',
        padding: '0.5rem',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderRadius: '6px',
        textAlign: 'center',
      }}>
        <span style={{ fontSize: '0.75rem', color: '#10b981' }}>
          ✅ Library imports are unlimited
        </span>
      </div>
    </div>
  );
};

export default TestingUserWidget;
