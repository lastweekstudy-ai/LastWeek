import React, { useState } from 'react';
import { callDeepSeekSimple, callGeminiText, callGroq } from '../services/secureAiProvider';

/**
 * Test component for secure AI proxy
 * Tests DeepSeek, Gemini, and Groq via Appwrite Function
 */
const SecureAITest = () => {
  const [provider, setProvider] = useState('deepseek');
  const [prompt, setPrompt] = useState('Say hello in one sentence.');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [logs, setLogs] = useState([]);

  const addLog = (message) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const handleTest = async () => {
    setLoading(true);
    setError('');
    setResponse('');
    setLogs([]);

    const startTime = Date.now();
    addLog(`Testing ${provider.toUpperCase()}...`);

    try {
      let result;
      
      switch (provider) {
        case 'deepseek':
          addLog('Calling DeepSeek via proxy...');
          result = await callDeepSeekSimple(prompt);
          break;
        case 'gemini':
          addLog('Calling Gemini via proxy...');
          result = await callGeminiText(prompt);
          break;
        case 'groq':
          addLog('Calling Groq via proxy...');
          result = await callGroq('', [{ role: 'user', content: prompt }]);
          break;
        default:
          throw new Error('Unknown provider');
      }

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      addLog(`✅ Success in ${duration}s`);
      addLog(`Response length: ${result.length} characters`);
      setResponse(result);
    } catch (err) {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      addLog(`❌ Failed in ${duration}s`);
      addLog(`Error: ${err.message}`);
      setError(err.message || 'Test failed');
      console.error('AI Proxy Test Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>🔐 AI Proxy Test Panel</h2>
        <p style={styles.subtitle}>
          Test DeepSeek, Gemini, and Groq via Appwrite Function
        </p>

        {/* Provider Selection */}
        <div style={styles.inputGroup}>
          <label style={styles.label}>Select Provider:</label>
          <div style={styles.providerButtons}>
            {['deepseek', 'gemini', 'groq'].map((p) => (
              <button
                key={p}
                onClick={() => setProvider(p)}
                style={{
                  ...styles.providerBtn,
                  ...(provider === p ? styles.providerBtnActive : {}),
                }}
              >
                {p.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Prompt Input */}
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

        {/* Test Button */}
        <button
          onClick={handleTest}
          disabled={loading || !prompt.trim()}
          style={{
            ...styles.button,
            ...(loading ? styles.buttonDisabled : {}),
          }}
        >
          {loading ? '⏳ Testing...' : `🚀 Test ${provider.toUpperCase()}`}
        </button>

        {/* Logs */}
        {logs.length > 0 && (
          <div style={styles.logs}>
            <strong>📋 Logs:</strong>
            {logs.map((log, i) => (
              <div key={i} style={styles.logLine}>{log}</div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={styles.error}>
            <strong>❌ Error:</strong> {error}
          </div>
        )}

        {/* Success */}
        {response && (
          <div style={styles.success}>
            <strong>✅ AI Response:</strong>
            <div style={styles.response}>{response}</div>
          </div>
        )}

        {/* Status Indicators */}
        <div style={styles.statusGrid}>
          <div style={styles.statusItem}>
            <span style={styles.statusLabel}>DeepSeek:</span>
            <span style={styles.statusValue}>✅ Working</span>
          </div>
          <div style={styles.statusItem}>
            <span style={styles.statusLabel}>Gemini:</span>
            <span style={{...styles.statusValue, color: '#f59e0b'}}>⚠️ Testing</span>
          </div>
          <div style={styles.statusItem}>
            <span style={styles.statusLabel}>Groq:</span>
            <span style={{...styles.statusValue, color: '#f59e0b'}}>⚠️ TPM Limited</span>
          </div>
        </div>

        {/* Info */}
        <div style={styles.info}>
          <h3 style={styles.infoTitle}>ℹ️ Current Fixes:</h3>
          <ul style={styles.list}>
            <li>✅ Gemini model: <code>gemini-1.5-flash-latest</code></li>
            <li>✅ Groq 8B: Reduced max_tokens to 2048</li>
            <li>⚠️ Timeout: Increase to 60s in Appwrite Console</li>
          </ul>
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
  providerButtons: {
    display: 'flex',
    gap: '0.5rem',
  },
  providerBtn: {
    flex: 1,
    padding: '0.75rem',
    fontSize: '0.9rem',
    fontWeight: '600',
    color: '#666',
    background: '#f0f0f0',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  providerBtnActive: {
    color: 'white',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderColor: '#667eea',
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
  logs: {
    padding: '1rem',
    background: '#1e1e1e',
    borderRadius: '8px',
    color: '#0f0',
    fontFamily: 'monospace',
    fontSize: '0.85rem',
    marginBottom: '1rem',
    maxHeight: '150px',
    overflowY: 'auto',
  },
  logLine: {
    margin: '0.25rem 0',
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
    maxHeight: '200px',
    overflowY: 'auto',
  },
  statusGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '1rem',
    marginTop: '1.5rem',
    marginBottom: '1.5rem',
  },
  statusItem: {
    textAlign: 'center',
    padding: '0.75rem',
    background: '#f8f9fa',
    borderRadius: '8px',
  },
  statusLabel: {
    display: 'block',
    fontSize: '0.8rem',
    color: '#666',
    marginBottom: '0.25rem',
  },
  statusValue: {
    fontWeight: '600',
    color: '#22c55e',
  },
  info: {
    marginTop: '1rem',
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
