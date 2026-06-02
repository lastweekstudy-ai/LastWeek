import React, { useState } from 'react';
import { callDeepSeekSimple } from '../services/secureAiProvider';

/**
 * Test component for secure AI proxy
 * This verifies that the Appwrite function works before full rollout
 */
const SecureAITest = () => {
  const [prompt, setPrompt] = useState('Tell me a fun fact about space in one sentence.');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTest = async () => {
    setLoading(true);
    setError('');
    setResponse('');

    try {
      const result = await callDeepSeekSimple(prompt);
      setResponse(result);
    } catch (err) {
      setError(err.message || 'Test failed');
      console.error('AI Proxy Test Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>🔐 Secure AI Proxy Test</h2>
        <p style={styles.subtitle}>
          Testing DeepSeek via Appwrite Function
        </p>

        <div style={styles.inputGroup}>
          <label style={styles.label}>Test Prompt:</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            style={styles.textarea}
            rows={3}
            placeholder="Enter a test prompt..."
          />
        </div>

        <button
          onClick={handleTest}
          disabled={loading || !prompt.trim()}
          style={{
            ...styles.button,
            ...(loading ? styles.buttonDisabled : {}),
          }}
        >
          {loading ? '⏳ Testing...' : '🚀 Test AI Proxy'}
        </button>

        {error && (
          <div style={styles.error}>
            <strong>❌ Error:</strong> {error}
          </div>
        )}

        {response && (
          <div style={styles.success}>
            <strong>✅ Success! AI Response:</strong>
            <div style={styles.response}>{response}</div>
          </div>
        )}

        <div style={styles.info}>
          <h3 style={styles.infoTitle}>ℹ️ Setup Instructions:</h3>
          <ol style={styles.list}>
            <li>Deploy the aiProxyUniversal function to Appwrite</li>
            <li>Set environment variable: <code>DEEPSEEK_API_KEY</code></li>
            <li>Add function ID to .env: <code>VITE_AI_PROXY_FUNCTION_ID=aiProxyUniversal</code></li>
            <li>Run this test to verify</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '2rem',
    maxWidth: '800px',
    margin: '0 auto',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  card: {
    background: 'white',
    borderRadius: '12px',
    padding: '2rem',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  },
  title: {
    margin: '0 0 0.5rem 0',
    fontSize: '1.75rem',
    color: '#1a1a1a',
  },
  subtitle: {
    margin: '0 0 1.5rem 0',
    color: '#666',
    fontSize: '0.95rem',
  },
  inputGroup: {
    marginBottom: '1rem',
  },
  label: {
    display: 'block',
    marginBottom: '0.5rem',
    fontWeight: '600',
    color: '#333',
  },
  textarea: {
    width: '100%',
    padding: '0.75rem',
    fontSize: '0.95rem',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    fontFamily: 'inherit',
    resize: 'vertical',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  button: {
    width: '100%',
    padding: '0.875rem 1.5rem',
    fontSize: '1rem',
    fontWeight: '600',
    color: 'white',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'transform 0.2s, opacity 0.2s',
    marginBottom: '1rem',
  },
  buttonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  error: {
    padding: '1rem',
    background: '#fee',
    border: '1px solid #fcc',
    borderRadius: '8px',
    color: '#c33',
    marginTop: '1rem',
  },
  success: {
    padding: '1rem',
    background: '#efe',
    border: '1px solid #cfc',
    borderRadius: '8px',
    color: '#363',
    marginTop: '1rem',
  },
  response: {
    marginTop: '0.75rem',
    padding: '0.75rem',
    background: 'white',
    borderRadius: '6px',
    fontSize: '0.95rem',
    lineHeight: '1.6',
  },
  info: {
    marginTop: '2rem',
    padding: '1.25rem',
    background: '#f8f9fa',
    borderRadius: '8px',
    borderLeft: '4px solid #667eea',
  },
  infoTitle: {
    margin: '0 0 0.75rem 0',
    fontSize: '1rem',
    color: '#333',
  },
  list: {
    margin: '0',
    paddingLeft: '1.5rem',
    color: '#555',
    lineHeight: '1.8',
  },
};

export default SecureAITest;
