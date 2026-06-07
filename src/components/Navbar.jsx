import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  CreativeSynthesisIcon,
} from './Icons';
import useKeyboardShortcuts from '../hooks/useKeyboardShortcuts';
import { useAuth } from '../context/AuthContext';
import '../styles/StorageIndicator.css';
import '../styles/Navbar.css';

/* ─── icon helpers ─────────────────────────────────────────── */
const IconDashboard = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="7" height="7" rx="1"/>
    <rect x="14" y="3" width="7" height="7" rx="1"/>
    <rect x="14" y="14" width="7" height="7" rx="1"/>
    <rect x="3" y="14" width="7" height="7" rx="1"/>
  </svg>
);
const IconExam = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);
const IconLanguage = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <line x1="2" y1="12" x2="22" y2="12"/>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
);
const IconKeyboard = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" ry="2"/>
    <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M7 16h10"/>
  </svg>
);
const IconStorage = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <ellipse cx="12" cy="5" rx="9" ry="3"/>
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
  </svg>
);

const IconFlashcard = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="7" width="20" height="15" rx="2" ry="2"/>
    <polyline points="17 2 12 7 7 2"/>
  </svg>
);
/* ─── NavItem — consistent row template ────────────────────── */
const NavItem = ({ icon, label, onClick, active, badge }) => (
  <button
    className={`nm-item${active ? ' nm-item--active' : ''}`}
    onClick={onClick}
    role="menuitem"
  >
    <span className="nm-item__icon">{icon}</span>
    <span className="nm-item__label">{label}</span>
    {badge && <span className="nm-item__badge">{badge}</span>}
  </button>
);

/* ─── NavRow — label + right-side widget ───────────────────── */
const NavRow = ({ icon, label, children }) => (
  <div className="nm-row">
    <span className="nm-row__left">
      <span className="nm-row__icon">{icon}</span>
      <span className="nm-row__label">{label}</span>
    </span>
    <span className="nm-row__right">{children}</span>
  </div>
);

/* ═══════════════════════════════════════════════════════════ */
const Navbar = ({ isSessionPage = false }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { activeSession, switchMode } = useSession();
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  /* close on route change */
  useEffect(() => { setDrawerOpen(false); }, [location.pathname]);

  /* lock body scroll while drawer is open */
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  useKeyboardShortcuts([
    { key: 'k', ctrl: true, callback: () => setShowShortcuts(true) },
    { key: 'd', ctrl: true, callback: () => navigate('/dashboard') },
    { key: 'n', ctrl: true, callback: () => navigate('/mode-select') },
    { key: 'Escape', callback: () => { setShowShortcuts(false); setDrawerOpen(false); } },
  ]);

  const handleSwitchMode = async (newMode) => {
    try { await switchMode(newMode); } catch (e) { console.error(e); }
  };

  const isOnSessionPage = location.pathname.includes('/session/') || isSessionPage;
  const go = (path) => { navigate(path); setDrawerOpen(false); };
  const is  = (path) => location.pathname === path;

  const getModeIcon = () => {
    if (!activeSession) return null;
    const p = { size: 20 };
    switch (activeSession.mode) {
      case 'mental_model':          return <MentalModelIcon {...p} />;
      case 'active_recall':         return <ActiveRecallIcon {...p} />;
      case 'focus_breakdown':       return <FocusBreakdownIcon {...p} />;
      case 'collaborative_scholar': return <CollaborativeScholarIcon {...p} />;
      case 'creative_synthesis':    return <CreativeSynthesisIcon {...p} />;
      default: return null;
    }
  };

  const getModeName = () => {
    const names = {
      mental_model: 'Mental Model', active_recall: 'Active Recall',
      focus_breakdown: 'Focus Breakdown', collaborative_scholar: 'Collaborative Scholar',
      creative_synthesis: 'Creative Synthesis',
    };
    return activeSession ? (names[activeSession.mode] || '') : '';
  };

  /* ── Drawer rendered via portal so it escapes any overflow:hidden parent ── */
  const drawer = drawerOpen && createPortal(
    <>
      {/* Backdrop */}
      <div
        className="nm-backdrop"
        onClick={() => setDrawerOpen(false)}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div className="nm-drawer" role="dialog" aria-label="Navigation menu" aria-modal="true">

        {/* Header */}
        <div className="nm-drawer__header">
          <span className="nm-drawer__title">Menu</span>
          <button
            className="nm-drawer__close"
            onClick={() => setDrawerOpen(false)}
            aria-label="Close menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="nm-drawer__body">

          {/* ── Session mode switcher ── */}
          {isOnSessionPage && activeSession && (
            <section className="nm-section">
              <p className="nm-section__label">Switch Mode</p>
              <select
                className="nm-select"
                value={activeSession.mode || 'mental_model'}
                onChange={(e) => { handleSwitchMode(e.target.value); setDrawerOpen(false); }}
              >
                <option value="mental_model">Mental Model</option>
                <option value="active_recall">Active Recall</option>
                <option value="focus_breakdown">Focus Breakdown</option>
                <option value="collaborative_scholar">Collaborative Scholar</option>
                <option value="creative_synthesis">Creative Synthesis</option>
              </select>
            </section>
          )}

          {/* ── Navigation links ── */}
          {!isOnSessionPage && (
            <section className="nm-section">
              <p className="nm-section__label">Navigate</p>
              <NavItem icon={<IconDashboard />}  label="Dashboard"         active={is('/dashboard')}         onClick={() => go('/dashboard')} />
              <NavItem icon={<IconExam />}        label="Exam Planner"      active={is('/exam-planner')}      onClick={() => go('/exam-planner')} />
              <NavItem icon={<IconLanguage />}    label="Language Learning" active={is('/language-learning')} onClick={() => go('/language-learning')} />
              <NavItem icon={<IconFlashcard />}   label="Flashcard Library" active={is('/flashcards')}        onClick={() => go('/flashcards')} />
            </section>
          )}

          {/* ── Utilities ── */}
          <section className="nm-section">
            <p className="nm-section__label">Utilities</p>

            <NavItem
              icon={<IconKeyboard />}
              label="Keyboard Shortcuts"
              badge="Ctrl+K"
              onClick={() => { setShowShortcuts(true); setDrawerOpen(false); }}
            />

            <NavRow icon={<IconStorage />} label="Storage">
              <StorageIndicator userId={user.$id} className="compact" lazy={true} />
            </NavRow>

            <NavRow
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="5"/>
                  <line x1="12" y1="1" x2="12" y2="3"/>
                  <line x1="12" y1="21" x2="12" y2="23"/>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                  <line x1="1" y1="12" x2="3" y2="12"/>
                  <line x1="21" y1="12" x2="23" y2="12"/>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
              }
              label="Theme"
            >
              <ThemeToggle />
            </NavRow>

            {isSessionPage && (
              <NavRow
                icon={
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                }
                label="Pomodoro"
              >
                <PomodoroTimer />
              </NavRow>
            )}
          </section>

          {/* ── Account ── */}
          <section className="nm-section nm-section--last">
            <p className="nm-section__label">Account</p>
            <div className="nm-profile-wrapper">
              <ProfileDropdown />
            </div>
          </section>

        </div>
      </div>
    </>,
    document.body
  );

  return (
    <>
      <nav className="navbar">
        <div className="container">
          <div className="navbar-content">

            {/* Left: brand + session info */}
            <div className="navbar-left">
              <div className="navbar-brand" onClick={() => navigate('/dashboard')}>
                <img src="/logos/lastweek_main_logo.png" alt="LastWeek" className="navbar-logo" />
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
                {/* Desktop actions */}
                <div className="navbar-actions navbar-desktop-actions">
                  {isOnSessionPage && activeSession && (
                    <select
                      className="mode-switcher"
                      value={activeSession?.mode || 'mental_model'}
                      onChange={(e) => handleSwitchMode(e.target.value)}
                    >
                      <option value="mental_model">Mental Model</option>
                      <option value="active_recall">Active Recall</option>
                      <option value="focus_breakdown">Focus Breakdown</option>
                      <option value="collaborative_scholar">Collaborative Scholar</option>
                      <option value="creative_synthesis">Creative Synthesis</option>
                    </select>
                  )}
                  {!isOnSessionPage && <StorageIndicator userId={user.$id} className="compact" lazy={true} />}
                  {!isOnSessionPage && (
                    <button className="btn btn-ghost" onClick={() => navigate('/exam-planner')}
                      style={{ color: is('/exam-planner') ? 'var(--color-accent)' : undefined }}>
                      <IconExam /> Exam Planner
                    </button>
                  )}
                  {!isOnSessionPage && (
                    <button className="btn btn-ghost" onClick={() => navigate('/language-learning')}
                      style={{ color: is('/language-learning') ? 'var(--color-accent)' : undefined }}>
                      <IconLanguage /> Language Learning
                    </button>
                  )}
                  {!isOnSessionPage && (
                    <button className="btn btn-ghost" onClick={() => navigate('/flashcards')}
                      style={{ color: is('/flashcards') ? 'var(--color-accent)' : undefined }}>
                      <IconFlashcard /> Flashcards
                    </button>
                  )}
                  <button className="btn btn-ghost btn-icon" onClick={() => setShowShortcuts(true)}
                    title="Keyboard Shortcuts (Ctrl+K)" aria-label="Show keyboard shortcuts">
                    <IconKeyboard />
                  </button>
                  <ThemeToggle />
                  {isSessionPage && <PomodoroTimer />}
                  <ProfileDropdown />
                </div>

                {/* Mobile hamburger */}
                <div className="navbar-mobile-wrapper">
                  <button
                    className={`navbar-hamburger${drawerOpen ? ' open' : ''}`}
                    onClick={() => setDrawerOpen(!drawerOpen)}
                    aria-label="Toggle navigation menu"
                    aria-expanded={drawerOpen}
                  >
                    <span className="hamburger-bar"></span>
                    <span className="hamburger-bar"></span>
                    <span className="hamburger-bar"></span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Drawer + backdrop via portal */}
      {drawer}

      <KeyboardShortcutsModal isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
    </>
  );
};

export default Navbar;
