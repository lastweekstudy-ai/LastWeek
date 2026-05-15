/**
 * TTS Demo Page
 * Interactive demo to test all TTS features
 */

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTTS } from '../tts/useTTSHook';
import { VOICES, STYLES, checkQuota, getMonthlyUsage } from '../tts';
import { speakConversation } from '../tts/ttsMulti';

const TTSDemo = () => {
  const { user } = useAuth();
  const { speak, speakLong, isPlaying, loading, error, pause, resume, stop, clearError } = useTTS({
    userId: user?.$id || 'demo-user',
  });

  const [text, setText] = useState('Hello! This is a test of the Gemini TTS system.');
  const [selectedVoice, setSelectedVoice] = useState(VOICES.KORE);
  const [selectedStyle, setSelectedStyle] = useState('');
  const [quota, setQuota] = useState(null);
  const [usage, setUsage] = useState(null);

  const handleSpeak = async () => {
    clearError();
    await speak(text, {
      voice: selectedVoice,
      style: selectedStyle,
    });
  };

  const handleSpeakLong = async () => {
    clearError();
    const longText = `
      This is a demonstration of the long text feature.
      The system automatically chunks text into sentences.
      Each sentence is spoken sequentially.
      This is perfect for articles, lessons, or any long-form content.
      The chunking happens automatically behind the scenes.
    `;
    await speakLong(longText, {
      voice: selectedVoice,
    });
  };

  const handleMultiSpeaker = async () => {
    clearError();
    const speakers = [
      { name: 'Teacher', voice: VOICES.KORE },
      { name: 'Student', voice: VOICES.PUCK },
    ];

    const script = [
      { speaker: 'Teacher', line: 'Hello! Welcome to the lesson.' },
      { speaker: 'Student', line: 'Thank you! I am excited to learn.' },
      { speaker: 'Teacher', line: 'Great! Let\'s get started.' },
    ];

    await speakConversation(speakers, script, {
      userId: user?.$id || 'demo-user',
    });
  };

  const handleCheckQuota = async () => {
    try {
      const userId = user?.$id || 'demo-user';
      const used = await getMonthlyUsage(userId);
      const quotaInfo = await checkQuota(userId, text.length);
      setUsage(used);
      setQuota(quotaInfo);
    } catch (err) {
      console.error('Error checking quota:', err);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>🎤 Gemini TTS Demo</h1>
      <p style={{ color: 'var(--color-text-muted)' }}>
        Test all features of the Gemini TTS system
      </p>

      {/* Error Display */}
      {error && (
        <div style={{
          padding: '1rem',
          background: '#fee2e2',
          border: '1px solid #ef4444',
          borderRadius: '0.5rem',
          marginBottom: '1rem',
          color: '#991b1b',
        }}>
          <strong>Error:</strong> {error}
          <button
            onClick={clearError}
            style={{
              marginLeft: '1rem',
              padding: '0.25rem 0.5rem',
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '0.25rem',
              cursor: 'pointer',
            }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Basic TTS */}
      <section style={{ marginBottom: '2rem', padding: '1.5rem', background: 'var(--color-bg-secondary)', borderRadius: '0.75rem' }}>
        <h2>Basic TTS</h2>
        
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter text to speak..."
          style={{
            width: '100%',
            minHeight: '100px',
            padding: '0.75rem',
            borderRadius: '0.5rem',
            border: '1px solid var(--color-border)',
            marginBottom: '1rem',
            fontFamily: 'inherit',
            fontSize: '1rem',
          }}
        />

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
              Voice
            </label>
            <select
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                borderRadius: '0.5rem',
                border: '1px solid var(--color-border)',
              }}
            >
              <option value={VOICES.PUCK}>Puck (Energetic)</option>
              <option value={VOICES.CHARON}>Charon (Authoritative)</option>
              <option value={VOICES.KORE}>Kore (Friendly)</option>
              <option value={VOICES.FENRIR}>Fenrir (Confident)</option>
              <option value={VOICES.AOEDE}>Aoede (Expressive)</option>
            </select>
          </div>

          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
              Style (Optional)
            </label>
            <select
              value={selectedStyle}
              onChange={(e) => setSelectedStyle(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                borderRadius: '0.5rem',
                border: '1px solid var(--color-border)',
              }}
            >
              <option value="">Normal</option>
              <option value={STYLES.CHEERFUL}>Cheerful</option>
              <option value={STYLES.SERIOUS}>Serious</option>
              <option value={STYLES.EXCITED}>Excited</option>
              <option value={STYLES.CALM}>Calm</option>
              <option value={STYLES.FRIENDLY}>Friendly</option>
              <option value={STYLES.PROFESSIONAL}>Professional</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={handleSpeak}
            disabled={loading || isPlaying}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'var(--color-accent)',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: loading || isPlaying ? 'not-allowed' : 'pointer',
              fontWeight: '600',
              opacity: loading || isPlaying ? 0.6 : 1,
            }}
          >
            {loading ? '⏳ Loading...' : isPlaying ? '🔊 Speaking...' : '🎤 Speak'}
          </button>

          {isPlaying && (
            <>
              <button
                onClick={pause}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#f59e0b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontWeight: '600',
                }}
              >
                ⏸️ Pause
              </button>
              <button
                onClick={stop}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontWeight: '600',
                }}
              >
                ⏹️ Stop
              </button>
            </>
          )}
        </div>
      </section>

      {/* Advanced Features */}
      <section style={{ marginBottom: '2rem', padding: '1.5rem', background: 'var(--color-bg-secondary)', borderRadius: '0.75rem' }}>
        <h2>Advanced Features</h2>
        
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={handleSpeakLong}
            disabled={loading || isPlaying}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#8b5cf6',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: loading || isPlaying ? 'not-allowed' : 'pointer',
              fontWeight: '600',
              opacity: loading || isPlaying ? 0.6 : 1,
            }}
          >
            📖 Long Text Demo
          </button>

          <button
            onClick={handleMultiSpeaker}
            disabled={loading || isPlaying}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: loading || isPlaying ? 'not-allowed' : 'pointer',
              fontWeight: '600',
              opacity: loading || isPlaying ? 0.6 : 1,
            }}
          >
            👥 Multi-Speaker Demo
          </button>
        </div>
      </section>

      {/* Quota Management */}
      <section style={{ marginBottom: '2rem', padding: '1.5rem', background: 'var(--color-bg-secondary)', borderRadius: '0.75rem' }}>
        <h2>Quota Management</h2>
        
        <button
          onClick={handleCheckQuota}
          style={{
            padding: '0.75rem 1.5rem',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            fontWeight: '600',
            marginBottom: '1rem',
          }}
        >
          📊 Check Usage & Quota
        </button>

        {usage !== null && quota && (
          <div style={{ padding: '1rem', background: 'var(--color-bg-tertiary)', borderRadius: '0.5rem' }}>
            <h3 style={{ marginTop: 0 }}>Usage Statistics</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Used</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '600' }}>{quota.used.toLocaleString()}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Limit</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '600' }}>{quota.limit.toLocaleString()}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Remaining</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '600', color: quota.remaining > 10000 ? '#10b981' : '#ef4444' }}>
                  {quota.remaining.toLocaleString()}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Percentage</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '600' }}>
                  {((quota.used / quota.limit) * 100).toFixed(1)}%
                </div>
              </div>
            </div>
            
            <div style={{ marginTop: '1rem', height: '20px', background: '#e5e7eb', borderRadius: '10px', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  background: quota.remaining > 10000 ? '#10b981' : '#ef4444',
                  width: `${(quota.used / quota.limit) * 100}%`,
                  transition: 'width 0.3s',
                }}
              />
            </div>
          </div>
        )}
      </section>

      {/* Info */}
      <section style={{ padding: '1.5rem', background: 'var(--color-bg-secondary)', borderRadius: '0.75rem' }}>
        <h2>ℹ️ Information</h2>
        <ul style={{ lineHeight: '1.8' }}>
          <li><strong>Caching:</strong> Repeat the same text to see instant playback (cached)</li>
          <li><strong>Voices:</strong> 5 distinct voices with different personalities</li>
          <li><strong>Styles:</strong> Add emotional tone to speech</li>
          <li><strong>Multi-Speaker:</strong> Natural conversations with multiple voices</li>
          <li><strong>Quota:</strong> 100,000 characters per month per user (configurable)</li>
        </ul>
      </section>
    </div>
  );
};

export default TTSDemo;
