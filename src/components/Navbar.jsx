import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import useSession from '../hooks/useSession';
import StorageIndicator from './StorageIndicator';
import ThemeToggle from './ThemeToggle';
import DarkModeToggle from './DarkModeToggle';
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
    className={`nav-item w-full justify-start ${active ? 'nav-item-active' : ''}`}
    onClick={onClick}
    role="menuitem"
  >
    <span className="flex h-5 w-5 items-center justify-center">{icon}</span>
    <span className="flex-1 text-left">{label}</span>
    {badge && <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[11px] font-semibold text-brand-700 dark:bg-brand-500/15 dark:text-brand-200">{badge}</span>}
  </button>
);

/* ─── NavRow — label + right-side widget ───────────────────── */
const NavRow = ({ icon, label, children }) => (
  <div className="flex items-center justify-between gap-3 rounded-2xl px-3 py-2 text-sm text-surface-700 dark:text-surface-200">
    <span className="flex min-w-0 items-center gap-3">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-brand-600 shadow-soft dark:bg-surface-900 dark:text-brand-300">{icon}</span>
      <span className="truncate font-medium">{label}</span>
    </span>
    <span className="flex shrink-0 items-center gap-2">{children}</span>
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
  const [desktopNavOpen, setDesktopNavOpen] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.localStorage.getItem('lastweek-desktop-nav-open') !== 'false';
  });

  /* close on route change */
  useEffect(() => { setDrawerOpen(false); }, [location.pathname]);

  /* lock body scroll while drawer is open */
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  useEffect(() => {
    document.body.classList.toggle('nav-collapsed', !desktopNavOpen);
    window.localStorage.setItem('lastweek-desktop-nav-open', desktopNavOpen ? 'true' : 'false');
    return () => document.body.classList.remove('nav-collapsed');
  }, [desktopNavOpen]);

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
        className="fixed inset-0 z-40 bg-surface-950/70 backdrop-blur-sm lg:hidden"
        onClick={() => setDrawerOpen(false)}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col border-l border-white/10 bg-white p-4 shadow-strong dark:bg-surface-950 lg:hidden" role="dialog" aria-label="Navigation menu" aria-modal="true">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-surface-200 pb-4 dark:border-surface-800">
          <span className="text-sm font-semibold uppercase tracking-[0.18em] text-surface-500 dark:text-surface-400">Menu</span>
          <button
            className="btn-ghost flex h-10 w-10 items-center justify-center rounded-full"
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
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain py-5 pb-24">

          {/* ── Session mode switcher ── */}
          {isOnSessionPage && activeSession && (
            <section className="space-y-2">
              <p className="px-3 text-xs font-semibold uppercase tracking-[0.18em] text-surface-500 dark:text-surface-400">Switch Mode</p>
              <select
                className="input-base"
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
            <section className="space-y-1">
              <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-[0.18em] text-surface-500 dark:text-surface-400">Navigate</p>
              <NavItem icon={<IconDashboard />}  label="Dashboard"         active={is('/dashboard')}         onClick={() => go('/dashboard')} />
              <NavItem icon={<IconExam />}        label="Exam Planner"      active={is('/exam-planner')}      onClick={() => go('/exam-planner')} />
              <NavItem icon={<IconLanguage />}    label="Language Learning" active={is('/language-learning')} onClick={() => go('/language-learning')} />
              <NavItem icon={<IconFlashcard />}   label="Flashcard Library" active={is('/flashcards')}        onClick={() => go('/flashcards')} />
            </section>
          )}

          {/* ── Utilities ── */}
          <section className="space-y-1">
            <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-[0.18em] text-surface-500 dark:text-surface-400">Utilities</p>

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
              <div className="flex items-center gap-2">
                <DarkModeToggle />
                <ThemeToggle />
              </div>
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
          <section className="space-y-2 border-t border-surface-200 pt-5 dark:border-surface-800">
            <p className="px-3 text-xs font-semibold uppercase tracking-[0.18em] text-surface-500 dark:text-surface-400">Account</p>
            <div className="px-1">
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
      <nav className={`fixed left-0 top-0 z-40 w-full border-b border-surface-200/80 bg-white/90 shadow-soft backdrop-blur-xl transition-transform duration-200 dark:border-surface-800 dark:bg-surface-950/88 lg:h-screen lg:w-64 lg:border-b-0 lg:border-r ${desktopNavOpen ? 'lg:translate-x-0' : 'lg:-translate-x-full'}`}>
        <div className="mx-auto flex h-full max-w-7xl px-4 lg:max-w-none lg:flex-col lg:px-3 lg:py-4">
          <div className="flex h-16 w-full items-center justify-between gap-3 lg:h-full lg:flex-col lg:items-stretch lg:justify-start">

            {/* Left: brand + session info */}
            <div className="flex min-w-0 items-center gap-3 lg:flex-col lg:items-stretch">
              <div className="flex cursor-pointer items-center gap-3 rounded-2xl px-2 py-2 transition hover:bg-surface-100 dark:hover:bg-surface-900" onClick={() => navigate('/dashboard')}>
                <img src="/logos/lastweek_main_logo.png" alt="LastWeek" className="h-9 w-9 rounded-xl object-contain" />
                <span className="hidden text-lg font-bold text-surface-950 dark:text-white sm:inline lg:inline">LastWeek</span>
              </div>
              <button
                className="btn-ghost hidden h-9 w-9 items-center justify-center rounded-full lg:flex"
                onClick={() => setDesktopNavOpen(false)}
                title="Collapse navigation"
                aria-label="Collapse navigation"
              >
                ×
              </button>

              {isOnSessionPage && activeSession && (
                <div className="hidden min-w-0 items-center gap-3 rounded-2xl border border-surface-200 bg-surface-50 px-3 py-2 text-sm dark:border-surface-800 dark:bg-surface-900 sm:flex lg:mt-2">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-200">{getModeIcon()}</span>
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-surface-950 dark:text-white">{getModeName()}</div>
                    <div className="truncate text-xs text-surface-500 dark:text-surface-400">{activeSession.subject}</div>
                  </div>
                </div>
              )}
            </div>

            {user && (
              <>
                {/* Desktop actions */}
                <div className="hidden w-full flex-1 flex-col gap-2 lg:flex">
                  {isOnSessionPage && activeSession && (
                    <select
                      className="input-base mb-3"
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
                    <button className={`nav-item justify-start ${is('/exam-planner') ? 'nav-item-active' : ''}`} onClick={() => navigate('/exam-planner')}>
                      <IconExam /> Exam Planner
                    </button>
                  )}
                  {!isOnSessionPage && (
                    <button className={`nav-item justify-start ${is('/language-learning') ? 'nav-item-active' : ''}`} onClick={() => navigate('/language-learning')}>
                      <IconLanguage /> Language Learning
                    </button>
                  )}
                  {!isOnSessionPage && (
                    <button className={`nav-item justify-start ${is('/flashcards') ? 'nav-item-active' : ''}`} onClick={() => navigate('/flashcards')}>
                      <IconFlashcard /> Flashcards
                    </button>
                  )}
                  <button className="nav-item justify-start" onClick={() => setShowShortcuts(true)}
                    title="Keyboard Shortcuts (Ctrl+K)" aria-label="Show keyboard shortcuts">
                    <IconKeyboard /> Shortcuts
                  </button>
                  <div className="mt-auto space-y-3 border-t border-surface-200 pt-4 dark:border-surface-800">
                    {isSessionPage && <PomodoroTimer />}
                    <div className="flex items-center gap-2">
                      <DarkModeToggle />
                      <ThemeToggle />
                    </div>
                    <ProfileDropdown />
                  </div>
                </div>

                {/* Mobile hamburger */}
                <div className="flex items-center gap-2 lg:hidden">
                  <DarkModeToggle />
                  <button
                    className="btn-ghost flex h-10 w-10 flex-col items-center justify-center gap-1.5 rounded-full"
                    onClick={() => setDrawerOpen(!drawerOpen)}
                    aria-label="Toggle navigation menu"
                    aria-expanded={drawerOpen}
                  >
                    <span className={`h-0.5 w-5 rounded-full bg-current transition ${drawerOpen ? 'translate-y-2 rotate-45' : ''}`}></span>
                    <span className={`h-0.5 w-5 rounded-full bg-current transition ${drawerOpen ? 'opacity-0' : ''}`}></span>
                    <span className={`h-0.5 w-5 rounded-full bg-current transition ${drawerOpen ? '-translate-y-2 -rotate-45' : ''}`}></span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </nav>

      {!desktopNavOpen && (
        <button
          className="btn-primary fixed left-4 top-4 z-50 hidden h-11 w-11 items-center justify-center rounded-full p-0 lg:flex"
          onClick={() => setDesktopNavOpen(true)}
          title="Open navigation"
          aria-label="Open navigation"
        >
          ☰
        </button>
      )}

      {/* Drawer + backdrop via portal */}
      {drawer}

      <KeyboardShortcutsModal isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
    </>
  );
};

export default Navbar;
