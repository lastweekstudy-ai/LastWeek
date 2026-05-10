import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useSession from '../hooks/useSession';
import StorageIndicator from './StorageIndicator';
import ThemeToggle from './ThemeToggle';
import KeyboardShortcutsModal from './KeyboardShortcutsModal';
import ProfileDropdown from './ProfileDropdown';
import { 
  HomeIcon,
  MentalModelIcon,
  ActiveRecallIcon,
  FocusBreakdownIcon,
  CollaborativeScholarIcon,
  CreativeSynthesisIcon
} from './Icons';
import useKeyboardShortcuts from '../hooks/useKeyboardShortcuts';
import { useAuth } from '../context/AuthContext';
import '../styles/StorageIndicator.css';

const Navbar = ({ 
  isSessionPage = false
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { activeSession, switchMode } = useSession();
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Keyboard shortcuts
  useKeyboardShortcuts([
    { key: 'k', ctrl: true, callback: () => setShowShortcuts(true) },
    { key: 'd', ctrl: true, callback: () => navigate('/dashboard') },
    { key: 'n', ctrl: true, callback: () => navigate('/mode-select') },
    { key: 'Escape', callback: () => setShowShortcuts(false) },
  ]);

  const handleSwitchMode = async (newMode) => {
    try {
      await switchMode(newMode);
      // Session ID is unchanged — SessionRoute re-renders via context update
    } catch (err) {
      console.error('Failed to switch mode:', err);
    }
  };

  // Determine if we're on a session/mode page
  const isOnSessionPage = location.pathname.includes('/session/') || isSessionPage;
  
  // Get mode icon
  const getModeIcon = () => {
    if (!activeSession) return null;
    const iconProps = { size: 24 };
    switch (activeSession.mode) {
      case 'mental_model': return <MentalModelIcon {...iconProps} />;
      case 'active_recall': return <ActiveRecallIcon {...iconProps} />;
      case 'focus_breakdown': return <FocusBreakdownIcon {...iconProps} />;
      case 'collaborative_scholar': return <CollaborativeScholarIcon {...iconProps} />;
      case 'creative_synthesis': return <CreativeSynthesisIcon {...iconProps} />;
      default: return null;
    }
  };

  const getModeName = () => {
    if (!activeSession) return '';
    const names = {
      'mental_model': 'Mental Model',
      'active_recall': 'Active Recall',
      'focus_breakdown': 'Focus Breakdown',
      'collaborative_scholar': 'Collaborative Scholar',
      'creative_synthesis': 'Creative Synthesis'
    };
    return names[activeSession.mode] || '';
  };

  return (
    <>
      <nav className="navbar">
        <div className="container">
          <div className="navbar-content">
            {/* Left side - Brand + Mode info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <div className="navbar-brand" onClick={() => navigate('/dashboard')}>
                <img 
                  src="/logos/lastweek_text_logo.png" 
                  alt="LastWeek" 
                  className="navbar-logo"
                  style={{ height: '48px', cursor: 'pointer' }}
                />
              </div>
              
              {isOnSessionPage && activeSession && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderLeft: '1px solid var(--color-border)', paddingLeft: '24px' }}>
                  {getModeIcon()}
                  <div>
                    <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      {getModeName()}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      {activeSession.subject}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {user && (
              <div className="navbar-actions" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                {/* Mode switcher for session pages */}
                {isOnSessionPage && activeSession && (
                  <select 
                    className="mode-switcher"
                    value={activeSession?.mode || 'mental_model'}
                    onChange={(e) => handleSwitchMode(e.target.value)}
                    disabled={!activeSession}
                    style={{ 
                      backgroundColor: 'var(--color-bg-tertiary)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--border-radius)',
                      color: 'var(--color-text-primary)',
                      padding: '6px 12px',
                      fontSize: '0.875rem',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="mental_model">Mental Model</option>
                    <option value="active_recall">Active Recall</option>
                    <option value="focus_breakdown">Focus Breakdown</option>
                    <option value="collaborative_scholar">Collaborative Scholar</option>
                    <option value="creative_synthesis">Creative Synthesis</option>
                  </select>
                )}
                
                {/* Common actions */}
                {!isOnSessionPage && <StorageIndicator userId={user.$id} className="compact" lazy={true} />}
                
                <button
                  className="btn btn-ghost btn-icon"
                  onClick={() => setShowShortcuts(true)}
                  title="Keyboard Shortcuts (Ctrl+K)"
                  aria-label="Show keyboard shortcuts"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="4" width="20" height="16" rx="2" ry="2"/>
                    <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M7 16h10"/>
                  </svg>
                </button>
                
                <ThemeToggle />
                
                <ProfileDropdown />
              </div>
            )}
          </div>
        </div>
      </nav>
      
      <KeyboardShortcutsModal isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
    </>
  );
};

export default Navbar;