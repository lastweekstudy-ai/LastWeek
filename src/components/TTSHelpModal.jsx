import React from 'react';
import { isSpeechSupported, getAvailableLanguages } from '../utils/geminiSpeech';

/**
 * TTS Help Modal - Explains text-to-speech setup to users
 * Shows when users encounter voice issues
 */
const TTSHelpModal = ({ isOpen, onClose, targetLanguage }) => {
  if (!isOpen) return null;

  const isSupported = isSpeechSupported();
  const availableLanguages = isSupported ? getAvailableLanguages() : [];
  const hasTargetLanguage = true; // Gemini TTS supports all languages

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--color-bg-primary, white)',
          borderRadius: '1rem',
          maxWidth: '600px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          padding: '2rem',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>🔊</span>
            <span>Gemini TTS Information</span>
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: 'var(--color-text-muted)',
              padding: '0.25rem',
            }}
          >
            ✕
          </button>
        </div>

        {/* Success Status */}
        <div style={{ padding: '1rem', background: '#d1fae5', borderRadius: '0.5rem', marginBottom: '1.5rem' }}>
          <p style={{ margin: 0, color: '#065f46', fontWeight: '600' }}>
            ✅ Gemini TTS is active and ready!
          </p>
          <p style={{ margin: '0.5rem 0 0', fontSize: '0.9rem', color: '#047857' }}>
            High-quality AI voices support all languages with consistent pronunciation.
          </p>
        </div>

        {/* What is Gemini TTS */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>What is Gemini TTS?</h3>
          <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.6', color: 'var(--color-text-secondary)' }}>
            This app uses <strong>Gemini Flash TTS</strong> - Google's advanced AI text-to-speech system. 
            It provides high-quality, natural-sounding voices for all languages with consistent pronunciation. 
            <strong>No browser setup or voice installation needed!</strong>
          </p>
        </div>

        {/* Features */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>Features</h3>
          <ul style={{ margin: 0, paddingLeft: '1.5rem', lineHeight: '1.8' }}>
            <li><strong>5 Professional Voices:</strong> Kore, Charon, Puck, Fenrir, Aoede</li>
            <li><strong>All Languages Supported:</strong> Works with any language you're learning</li>
            <li><strong>Consistent Quality:</strong> Same voice quality across all devices</li>
            <li><strong>Smart Caching:</strong> Repeat phrases play instantly</li>
            <li><strong>No Setup Required:</strong> Works immediately, no installation</li>
          </ul>
        </div>

        {/* Available Languages */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>
            Supported Languages (All)
          </h3>
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
            Gemini TTS supports all major languages including:
          </p>
          <div style={{ 
            marginTop: '0.75rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '0.5rem'
          }}>
            {availableLanguages.slice(0, 12).map((lang) => (
              <div
                key={lang.code}
                style={{
                  padding: '0.5rem',
                  background: 'var(--color-bg-secondary)',
                  borderRadius: '0.5rem',
                  fontSize: '0.85rem',
                  textAlign: 'center',
                }}
              >
                {lang.name}
              </div>
            ))}
          </div>
          <p style={{ margin: '0.75rem 0 0', fontSize: '0.85rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>
            ...and many more!
          </p>
        </div>

        {/* Remove old "How to Add Voices" section since it's not needed */}
        
        {/* Important Note */}
        <div style={{ padding: '1rem', background: 'var(--color-bg-secondary)', borderRadius: '0.5rem', borderLeft: '4px solid var(--color-accent)' }}>
          <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: '1.6' }}>
            <strong>💡 Powered by AI:</strong> This app uses Gemini Flash TTS for superior voice quality. 
            Audio is cached for instant playback on repeated phrases. Requires internet connection.
          </p>
        </div>

        {/* Close Button */}
        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <button
            onClick={onClose}
            style={{
              padding: '0.75rem 2rem',
              background: 'var(--color-accent)',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '600',
            }}
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
};

export default TTSHelpModal;
