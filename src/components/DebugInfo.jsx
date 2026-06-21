import React from 'react';

const DebugInfo = () => {
  const [isVisible, setIsVisible] = React.useState(true);

  const envVars = {
    PROJECT_ID: import.meta.env.VITE_APPWRITE_PROJECT_ID,
    ENDPOINT: import.meta.env.VITE_APPWRITE_ENDPOINT,
    DATABASE_ID: import.meta.env.VITE_APPWRITE_DATABASE_ID,
    SESSIONS_COLLECTION_ID: import.meta.env.VITE_APPWRITE_SESSIONS_COLLECTION_ID,
    MESSAGES_COLLECTION_ID: import.meta.env.VITE_APPWRITE_MESSAGES_COLLECTION_ID,
    FLASHCARDS_COLLECTION_ID: import.meta.env.VITE_APPWRITE_FLASHCARDS_COLLECTION_ID,
    PROFILES_COLLECTION_ID: import.meta.env.VITE_APPWRITE_PROFILES_COLLECTION_ID
  };

  const hasPlaceholders = Object.entries(envVars).some(([key, value]) => 
    !value || 
    value.includes('REPLACE') || 
    value.includes('<') || 
    value.includes('>')
  );

  if (!isVisible) {
    return null;
  }

  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      right: '10px', 
      background: '#1a1f2e', 
      border: '1px solid #6366f1', 
      borderRadius: '8px', 
      padding: '16px', 
      fontSize: '12px', 
      fontFamily: 'monospace',
      color: '#f8fafc',
      maxWidth: '400px',
      zIndex: 9999
    }}>
      <h4 style={{ margin: '0 0 8px 0', color: '#6366f1' }}>Environment Debug</h4>
      
      {hasPlaceholders && (
        <div style={{ 
          background: '#ef4444', 
          color: 'white', 
          padding: '8px', 
          borderRadius: '4px', 
          marginBottom: '8px' 
        }}>
          ⚠️ CONFIGURATION ERROR: Please update .env with real Appwrite collection IDs
        </div>
      )}
      
      {Object.entries(envVars).map(([key, value]) => (
        <div key={key} style={{ marginBottom: '4px' }}>
          <strong>{key}:</strong> {value || 'Not Set'}
        </div>
      ))}
      
      <button 
        onClick={() => setIsVisible(false)}
        style={{ 
          marginTop: '8px', 
          padding: '4px 8px', 
          background: '#6366f1', 
          color: 'white', 
          border: 'none', 
          borderRadius: '4px', 
          cursor: 'pointer' 
        }}
      >
        Hide
      </button>
    </div>
  );
};

export default DebugInfo;
