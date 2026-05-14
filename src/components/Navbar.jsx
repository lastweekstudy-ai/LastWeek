import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useSession from '../hooks/useSession';
import StorageIndicator from './StorageIndicator';
import ThemeToggle from './ThemeToggle';
import KeyboardShortcutsModal from './KeyboardShortcutsModal';
import ProfileDropdown from './ProfileDropdown';
import PomodoroTimer from './PomodoroTimer';
import { 
  MentalModelIcon,
  ActiveRecallIcon,
  FocusBreakdownIcon,
  CollaborativeScholarIcon,
  CreativeSynthesisIcon
} from './Icons';
import useKeyboardShortcuts from '../hooks/useKeyboardShortcuts';
import { useAuth } from '../context/AuthContext';
import '../styles/StorageIndicator.css';
import '../styles/Navbar.css';

const Navbar = ({ isSessionPage = false }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { activeSession, switchMode } = useSession();
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMobileMenuOpen(false);
      }
    };
    if (mobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [mobileMenuOpen]);

  // Keyboard shortcuts
  useKeyboardShortcuts([
    { key: 'k', ctrl: true, callback: () => setShowShortcuts(true) },
    { key: 'd', ctrl: true, callback: () => navigate('/dashboard') },
    { key: 'n', ctrl: true, callback: () => navigate('/mode-select') },
    { key: 'Escape', callback: () => { setShowShortcuts(false); setMobileMenuOpen(false); } },
  ]);

  const handleSwitchMode = async (newMode) => {
    try {
      await switchMode(newMode);
    } catch (err) {
      console.error('Failed to switch mode:', err);
    }
  };

  const isOnSessionPage = location.pathname.includes('/session/') || isSessionPage;

  const getModeIcon = () => {
    if (!activeSession) return null;
    const iconProps = { size: 20 };
    switch (activeSession.mode) {
      case 'mental_model':          return <MentalModelIcon {...iconProps} />;
      case 'active_recall':         return <ActiveRecallIcon {...iconProps} />;
      case 'focus_breakdown':       return <FocusBreakdownIcon {...iconProps} />;
      case 'collaborative_scholar': return <CollaborativeScholarIcon {...iconProps} />;
      case 'creative_synthesis':    return <CreativeSynthesisIcon {...iconProps} />;
      default: return null;
    }
  };

  const getModeName = () => {
    if (!activeSession) return '';
    const names = {
      mental_model:           'Mental Model',
      active_recall:          'Active Recall',
      focus_breakdown:        'Focus Breakdown',
      collaborative_scholar:  'Collaborative Scholar',
      creative_synthesis:     'Creative Synthesis',
    };
    return names[activeSession.mode] || '';
  };

  const navClose = (fn) => () => { fn(); setMobileMenuOpen(false); };

  return (
    <>
      <nav className="navbar">
        <div className="container">
          <div className="navbar-content">

            {/* ── Left: Brand + session info ── */}
            <div className="navbar-left">
              <div className="navbar-brand" onClick={() => navigate('/dashboard')}>
                <img
                  src="/logos/lastweek_text_logo.png"
                  alt="LastWeek"
                  className="navbar-logo"
                />
              </div>

              {isOnSessionPage && activeSession && (
                <div className="navbar-session-info">
                  {getModeIcon()}
                  <div>
                    <div className="navbar-session-mode">{getModeName()}</div>
                    <div className="navbar-session-subject">{activeSession.subject}</div>
                  </div>
                </div>
              )}
            </div>

            {user && (
              <>
                {/* ── Desktop actions (hidden on mobile via CSS) ── */}
                <div className="navbar-actions navbar-desktop-actions">
                  {isOnSessionPage && activeSession && (
                    <select
                      className="mode-switcher"
                      value={activeSession?.mode || 'mental_model'}
                      onChange={(e) => handleSwitchMode(e.target.value)}
                      disabled={!activeSession}
                    >
                      <option value="mental_model">Mental Model</option>
                      <option value="active_recall">Active Recall</option>
                      <option value="focus_breakdown">Focus Breakdown</option>
                      <option value="collaborative_scholar">Collaborative Scholar</option>
                      <option value="creative_synthesis">Creative Synthesis</option>
                    </select>
                  )}

                  {!isOnSessionPage && (
                    <StorageIndicator userId={user.$id} className="compact" lazy={true} />
                  )}

                  {!isOnSessionPage && (
                    <button
                      className="btn btn-ghost"
                      onClick={() => navigate('/exam-planner')}
                      title="Exam Planner"
                      style={{ color: location.pathname === '/exam-planner' ? 'var(--color-accent)' : undefined }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                      Exam Planner
                    </button>
                  )}

                  {!isOnSessionPage && (
                    <button
                      className="btn btn-ghost"
                      onClick={() => navigate('/language-learning')}
                      title="Language Learning"
                      style={{ color: location.pathname === '/language-learning' ? 'var(--color-accent)' : undefined }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="2" y1="12" x2="22" y2="12"/>
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                      </svg>
                      Language Learning
                    </button>
                  )}

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
                  {isSessionPage && <PomodoroTimer />}
                  <ProfileDropdown />
                </div>

                {/* ── Mobile: hamburger + dropdown ── */}
                <div className="navbar-mobile-wrapper" ref={menuRef}>
                  {/* Hamburger button — only visible on mobile */}
                  <button
                    className={`navbar-hamburger${mobileMenuOpen ? ' open' : ''}`}
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    aria-label="Toggle navigation menu"
                    aria-expanded={mobileMenuOpen}
                  >
                    <span className="hamburger-bar" />
                    <span className="hamburger-bar" />
                    <span className="hamburger-bar" />
                  </button>

                  {/* Dropdown panel */}
                  {mobileMenuOpen && (
                    <div className="navbar-mobile-dropdown" role="menu">

                      {/* Session: mode switcher */}
                      {isOnSessionPage && activeSession && (
                        <>
                          <div className="mobile-menu-label">Switch Mode</div>
                          <select
                            className="mobile-menu-select"
                            value={activeSession?.mode || 'mental_model'}
                            onChange={(e) => { handleSwitchMode(e.target.value); setMobileMenuOpen(false); }}
                            disabled={!activeSession}
                          >
                            <option value="mental_model">Mental Model</option>
                            <option value="active_recall">Active Recall</option>
                            <option value="focus_breakdown">Focus Breakdown</option>
                            <option value="collaborative_scholar">Collaborative Scholar</option>
                            <option value="creative_synthesis">Creative Synthesis</option>
                          </select>
                          <div className="mobile-menu-divider" />
                        </>
                      )}

                      {/* Non-session: nav links */}
                      {!isOnSessionPage && (
                        <>
                          <button
                            className={`mobile-menu-item${location.pathname === '/exam-planner' ? ' active' : ''}`}
                            onClick={navClose(() => navigate('/exam-planner'))}
                            role="menuitem"
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="3" y="4" width="18" height="18" rx="2"/>
                              <line x1="16" y1="2" x2="16" y2="6"/>
                              <line x1="8" y1="2" x2="8" y2="6"/>
                              <line x1="3" y1="10" x2="21" y2="10"/>
                            </svg>
                            Exam Planner
                          </button>

                          <button
                            className={`mobile-menu-item${location.pathname === '/language-learning' ? ' active' : ''}`}
                            onClick={navClose(() => navigate('/language-learning'))}
                            role="menuitem"
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10"/>
                              <line x1="2" y1="12" x2="22" y2="12"/>
                              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                            </svg>
                            Language Learning
                          </button>

                          <button
                            className={`mobile-menu-item${location.pathname === '/dashboard' ? ' active' : ''}`}
                            onClick={navClose(() => navigate('/dashboard'))}
                            role="menuitem"
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                              <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                            </svg>
                            Dashboard
                          </button>

                          <div className="mobile-menu-divider" />

                          <div className="mobile-menu-storage">
                            <StorageIndicator userId={user.$id} className="compact" lazy={true} />
                          </div>

                          <div className="mobile-menu-divider" />
                        </>
                      )}

                      {/* Keyboard shortcuts */}
                      <button
                        className="mobile-menu-item"
                        onClick={navClose(() => setShowShortcuts(true))}
                        role="menuitem"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="2" y="4" width="20" height="16" rx="2" ry="2"/>
                          <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M7 16h10"/>
                        </svg>
                        Keyboard Shortcuts
                        <span className="mobile-menu-shortcut">Ctrl+K</span>
                      </button>

                      {/* Theme toggle row */}
                      <div className="mobile-menu-row">
                        <span className="mobile-menu-row-label">Theme</span>
                        <ThemeToggle />
                      </div>

                      {/* Pomodoro on session pages */}
                      {isSessionPage && (
                        <>
                          <div className="mobile-menu-divider" />
                          <div className="mobile-menu-row">
                            <span className="mobile-menu-row-label">Pomodoro</span>
                            <PomodoroTimer />
                          </div>
                        </>
                      )}

                      <div className="mobile-menu-divider" />

                      {/* Profile */}
                      <div className="mobile-menu-profile">
                        <ProfileDropdown />
                      </div>

                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </nav>

      <KeyboardShortcutsModal isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
    </>
  );
};

export default Navbar;
