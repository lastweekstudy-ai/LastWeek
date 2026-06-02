import React, { useState, useEffect } from 'react';
import { databases } from '../../appwrite/config';
import { Query } from 'appwrite';

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const TESTING_USAGE_COLLECTION_ID = import.meta.env.VITE_APPWRITE_TESTING_USAGE_COLLECTION_ID || 'testing_usage';

/**
 * TestingUsers - Admin page to view all testing mode users
 */
const TestingUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState('');

  useEffect(() => {
    loadTestingUsers();
  }, []);

  const loadTestingUsers = async () => {
    try {
      setLoading(true);
      setError('');
      setDebugInfo(`Database: ${DATABASE_ID}, Collection: ${TESTING_USAGE_COLLECTION_ID}`);
      
      console.log('[TestingUsers] Loading testing users...');
      console.log('[TestingUsers] DATABASE_ID:', DATABASE_ID);
      console.log('[TestingUsers] TESTING_USAGE_COLLECTION_ID:', TESTING_USAGE_COLLECTION_ID);
      
      const result = await databases.listDocuments(
        DATABASE_ID,
        TESTING_USAGE_COLLECTION_ID,
        [Query.orderDesc('createdAt'), Query.limit(100)]
      );
      
      console.log('[TestingUsers] Result:', result);
      console.log('[TestingUsers] Documents found:', result.documents.length);
      
      setUsers(result.documents);
    } catch (err) {
      console.error('[TestingUsers] Failed to load:', err.message);
      console.error('[TestingUsers] Full error:', err);
      setError(`Failed to load testing users: ${err.message}. Make sure the collection exists and has correct permissions.`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <p style={{ color: 'var(--color-text-muted)' }}>Loading testing users...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <p style={{ color: '#ef4444' }}>{error}</p>
        <button
          onClick={loadTestingUsers}
          style={{
            marginTop: '1rem',
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: 'var(--color-accent)',
            color: 'white',
            cursor: 'pointer',
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
          Testing Users
        </h1>
        <p style={{ color: 'var(--color-text-muted)', margin: '0.5rem 0 0' }}>
          Users who claimed free testing slots ({users.length} total)
        </p>
      </div>

      {users.length === 0 ? (
        <div style={{
          backgroundColor: 'var(--color-bg-secondary)',
          borderRadius: '12px',
          border: '1px solid var(--color-border)',
          padding: '2rem',
          textAlign: 'center',
        }}>
          <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>
            No testing users yet. Users will appear here when they claim free testing slots.
          </p>
        </div>
      ) : (
        <div style={{
          backgroundColor: 'var(--color-bg-secondary)',
          borderRadius: '12px',
          border: '1px solid var(--color-border)',
          overflow: 'hidden',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', color: 'var(--color-text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Email</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Sessions</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>PDFs</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Audios</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Messages</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Reviewed</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Pre-Reg</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', color: 'var(--color-text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Created</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.$id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-primary)', fontSize: '0.875rem' }}>
                    {user.email || user.userId}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'center', color: user.sessions >= 1 ? '#ef4444' : 'var(--color-text-primary)', fontSize: '0.875rem' }}>
                    {user.sessions || 0}/1
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'center', color: user.pdfs >= 1 ? '#ef4444' : 'var(--color-text-primary)', fontSize: '0.875rem' }}>
                    {user.pdfs || 0}/1
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'center', color: user.audios >= 1 ? '#ef4444' : 'var(--color-text-primary)', fontSize: '0.875rem' }}>
                    {user.audios || 0}/1
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'center', color: user.messages >= 100 ? '#ef4444' : 'var(--color-text-primary)', fontSize: '0.875rem' }}>
                    {user.messages || 0}/100
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                    {user.hasReviewed ? (
                      <span style={{ color: '#10b981' }}>✓</span>
                    ) : (
                      <span style={{ color: 'var(--color-text-muted)' }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                    {user.addedToPreReg ? (
                      <span style={{ color: '#10b981' }}>✓</span>
                    ) : (
                      <span style={{ color: 'var(--color-text-muted)' }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TestingUsers;
