import React from 'react';
import { isSpeechSupported, getAvailableLanguages } from '../utils/speech';

/**
 * TTS Help Modal - Explains text-to-speech setup to users
 * Shows when users encounter voice issues
 */
const TTSHelpModal = ({ isOpen, onClose, targetLanguage }) => {
  if (!isOpen) return null;

  const isSupported = isSpeechSupported();
  const availableLanguages = isSupported ? getAvailableLanguages() : [];
  const hasTargetLanguage = availableLanguages.some(l => l.code === targetLanguage);

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
            <span>Text-to-Speech Help</span>
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

        {/* Browser Support Status */}
        {!isSupported ? (
          <div style={{ padding: '1rem', background: '#fee2e2', borderRadius: '0.5rem', marginBottom: '1.5rem' }}>
            <p style={{ margin: 0, color: '#991b1b', fontWeight: '600' }}>
              ⚠️ Your browser doesn't support text-to-speech
            </p>
            <p style={{ margin: '0.5rem 0 0', fontSize: '0.9rem', color: '#7f1d1d' }}>
              Please use Chrome, Edge, Safari, or Firefox for the best experience.
            </p>
          </div>
        ) : hasTargetLanguage ? (
          <div style={{ padding: '1rem', background: '#d1fae5', borderRadius: '0.5rem', marginBottom: '1.5rem' }}>
            <p style={{ margin: 0, color: '#065f46', fontWeight: '600' }}>
              ✅ Your browser supports your target language!
            </p>
            <p style={{ margin: '0.5rem 0 0', fontSize: '0.9rem', color: '#047857' }}>
              Text-to-speech should work properly for your lessons.
            </p>
          </div>
        ) : (
          <div style={{ padding: '1rem', background: '#fef3c7', borderRadius: '0.5rem', marginBottom: '1.5rem' }}>
            <p style={{ margin: 0, color: '#92400e', fontWeight: '600' }}>
              ⚠️ Limited voice support for your target language
            </p>
            <p style={{ margin: '0.5rem 0 0', fontSize: '0.9rem', color: '#78350f' }}>
              You may need to install additional voices in your operating system settings.
            </p>
          </div>
        )}

        {/* What is TTS */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>What is Text-to-Speech?</h3>
          <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.6', color: 'var(--color-text-secondary)' }}>
            This app uses your browser's built-in text-to-speech feature. <strong>No installation or downloads are needed for the app itself.</strong> 
            However, your browser relies on voices installed in your operating system.
          </p>
        </div>

        {/* Available Languages */}
        {isSupported && availableLanguages.length > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>
              Available Languages ({availableLanguages.length})
            </h3>
            <div style={{ 
              maxHeight: '200px', 
              overflow: 'auto', 
              border: '1px solid var(--color-border)', 
              borderRadius: '0.5rem',
              padding: '0.5rem'
            }}>
              {availableLanguages.map((lang) => (
                <div
                  key={lang.code}
                  style={{
                    padding: '0.5rem',
                    borderBottom: '1px solid var(--color-border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontWeight: lang.code === targetLanguage ? '600' : '400' }}>
                    {lang.name}
                    {lang.code === targetLanguage && ' ⭐'}
                  </span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                    {lang.voiceCount} {lang.voiceCount === 1 ? 'voice' : 'voices'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* How to Add Voices */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>How to Add More Voices</h3>
          
          {/* Windows */}
          <details style={{ marginBottom: '0.75rem' }}>
            <summary style={{ cursor: 'pointer', fontWeight: '600', padding: '0.5rem', background: 'var(--color-bg-secondary)', borderRadius: '0.5rem' }}>
              🪟 Windows 10/11
            </summary>
            <ol style={{ marginTop: '0.5rem', paddingLeft: '1.5rem', fontSize: '0.9rem', lineHeight: '1.8' }}>
              <li>Open <strong>Settings</strong> → <strong>Time & Language</strong> → <strong>Language</strong></li>
              <li>Click <strong>Add a language</strong></li>
              <li>Select your target language (e.g., Spanish, Chinese)</li>
              <li>Click <strong>Options</strong> → <strong>Download</strong> under Speech</li>
              <li><strong>Restart your browser</strong> after installation</li>
            </ol>
          </details>

          {/* macOS */}
          <details style={{ marginBottom: '0.75rem' }}>
            <summary style={{ cursor: 'pointer', fontWeight: '600', padding: '0.5rem', background: 'var(--color-bg-secondary)', borderRadius: '0.5rem' }}>
              🍎 macOS
            </summary>
            <ol style={{ marginTop: '0.5rem', paddingLeft: '1.5rem', fontSize: '0.9rem', lineHeight: '1.8' }}>
              <li>Open <strong>System Preferences</strong> → <strong>Accessibility</strong> → <strong>Spoken Content</strong></li>
              <li>Click <strong>System Voice</strong> → <strong>Manage Voices</strong></li>
              <li>Download voices for your target languages</li>
              <li><strong>Restart your browser</strong></li>
            </ol>
          </details>

          {/* iOS */}
          <details style={{ marginBottom: '0.75rem' }}>
            <summary style={{ cursor: 'pointer', fontWeight: '600', padding: '0.5rem', background: 'var(--color-bg-secondary)', borderRadius: '0.5rem' }}>
              📱 iOS/iPadOS
            </summary>
            <ol style={{ marginTop: '0.5rem', paddingLeft: '1.5rem', fontSize: '0.9rem', lineHeight: '1.8' }}>
              <li>Go to <strong>Settings</strong> → <strong>Accessibility</strong> → <strong>Spoken Content</strong></li>
              <li>Tap <strong>Voices</strong></li>
              <li>Select your language and download additional voices</li>
              <li>Restart Safari</li>
            </ol>
          </details>

          {/* Android */}
          <details style={{ marginBottom: '0.75rem' }}>
            <summary style={{ cursor: 'pointer', fontWeight: '600', padding: '0.5rem', background: 'var(--color-bg-secondary)', borderRadius: '0.5rem' }}>
              🤖 Android
            </summary>
            <ol style={{ marginTop: '0.5rem', paddingLeft: '1.5rem', fontSize: '0.9rem', lineHeight: '1.8' }}>
              <li>Open <strong>Settings</strong> → <strong>System</strong> → <strong>Languages & input</strong></li>
              <li>Tap <strong>Text-to-speech output</strong></li>
              <li>Tap <strong>Google Text-to-speech Engine</strong> → <strong>Install voice data</strong></li>
              <li>Download languages you need</li>
            </ol>
          </details>
        </div>

        {/* Best Browsers */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>Recommended Browsers</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.75rem' }}>
            <div style={{ padding: '0.75rem', background: 'var(--color-bg-secondary)', borderRadius: '0.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>🥇</div>
              <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>Chrome</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Best support</div>
            </div>
            <div style={{ padding: '0.75rem', background: 'var(--color-bg-secondary)', borderRadius: '0.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>🥈</div>
              <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>Edge</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Excellent</div>
            </div>
            <div style={{ padding: '0.75rem', background: 'var(--color-bg-secondary)', borderRadius: '0.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>🥉</div>
              <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>Safari</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Good</div>
            </div>
          </div>
        </div>

        {/* Important Note */}
        <div style={{ padding: '1rem', background: 'var(--color-bg-secondary)', borderRadius: '0.5rem', borderLeft: '4px solid var(--color-accent)' }}>
          <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: '1.6' }}>
            <strong>💡 Important:</strong> This is <strong>not an app issue</strong>. The app uses your browser's built-in 
            text-to-speech feature. If you're seeing warnings, it means your browser/OS doesn't have voices installed 
            for your target language. Follow the instructions above to add them.
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
