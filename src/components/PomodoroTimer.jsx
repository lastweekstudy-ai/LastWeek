import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/PomodoroTimer.css';

const MODES = {
  focus:       { label: 'Focus',       minutes: 25, color: 'var(--color-accent)' },
  short_break: { label: 'Short Break', minutes: 5,  color: 'var(--color-success)' },
  long_break:  { label: 'Long Break',  minutes: 15, color: 'var(--color-info)'    },
};

const PomodoroTimer = () => {
  const navigate   = useNavigate();
  const location   = useLocation();
  const [open, setOpen]           = useState(false);
  const [mode, setMode]           = useState('focus');
  const [secondsLeft, setSeconds] = useState(MODES.focus.minutes * 60);
  const [running, setRunning]     = useState(false);
  const [sessions, setSessions]   = useState(0);
  // Store the session path so we can navigate back after break
  const sessionPathRef            = useRef(null);
  const intervalRef               = useRef(null);
  const switchModeRef             = useRef(null);
  const btnRef                    = useRef(null);
  const [panelPos, setPanelPos]   = useState({ top: 0, right: 0 });

  const totalSeconds = MODES[mode].minutes * 60;
  const pct          = ((totalSeconds - secondsLeft) / totalSeconds) * 100;
  const mins         = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const secs         = String(secondsLeft % 60).padStart(2, '0');

  // ── Position panel relative to button (fixed to viewport) ─────────────────
  const updatePanelPos = useCallback(() => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    setPanelPos({
      top: rect.bottom + 8,
      right: window.innerWidth - rect.right,
    });
  }, []);

  useEffect(() => {
    if (open) {
      updatePanelPos();
      window.addEventListener('resize', updatePanelPos);
      window.addEventListener('scroll', updatePanelPos, true);
    }
    return () => {
      window.removeEventListener('resize', updatePanelPos);
      window.removeEventListener('scroll', updatePanelPos, true);
    };
  }, [open, updatePanelPos]);

  // ── Close panel when clicking outside ─────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (!btnRef.current?.closest('.pomo-wrapper')?.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // ── Tick ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds(s => {
          if (s <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            handleComplete();
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  // ── Switch mode ────────────────────────────────────────────────────────────
  const switchMode = (newMode) => {
    setMode(newMode);
    setSeconds(MODES[newMode].minutes * 60);
    setRunning(false);
  };

  useEffect(() => { switchModeRef.current = switchMode; });

  // ── Complete ───────────────────────────────────────────────────────────────
  const handleComplete = useCallback(() => {
    playBeep();
    if (mode === 'focus') {
      setSessions(s => {
        const next = s + 1;
        const nextMode = next % 4 === 0 ? 'long_break' : 'short_break';
        switchModeRef.current?.(nextMode);
        // Auto-start break
        setTimeout(() => setRunning(true), 300);
        return next;
      });
    } else {
      // Break finished — switch back to focus and navigate back to session
      switchModeRef.current?.('focus');
      if (sessionPathRef.current) {
        navigate(sessionPathRef.current);
      }
    }
  }, [mode, navigate]);

  // ── Track session path when focus starts ──────────────────────────────────
  const handleStartFocus = () => {
    if (!running && mode === 'focus') {
      // Save current path so we can return after break
      if (location.pathname.includes('/session/') || location.pathname.includes('/exam-session/')) {
        sessionPathRef.current = location.pathname;
      }
    }
    setRunning(r => !r);
  };

  // ── Navigation guard — block leaving session during focus ─────────────────
  useEffect(() => {
    if (!running || mode !== 'focus') return;

    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [running, mode]);

  // ── Reset ──────────────────────────────────────────────────────────────────
  const reset = () => {
    setSeconds(MODES[mode].minutes * 60);
    setRunning(false);
  };

  // ── Beep ───────────────────────────────────────────────────────────────────
  const playBeep = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.8);
    } catch (e) {}
  };

  // ── SVG circle ────────────────────────────────────────────────────────────
  const r = 36;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference * (1 - pct / 100);

  const modeColor = MODES[mode].color;

  return (
    <div className="pomo-wrapper">
      {/* Navbar button */}
      <button
        ref={btnRef}
        className={`pomo-fab ${running ? 'running' : ''}`}
        onClick={() => { updatePanelPos(); setOpen(o => !o); }}
        title="Pomodoro Timer"
        aria-label="Open Pomodoro Timer"
        style={running ? { '--pomo-color': modeColor } : {}}
      >
        {running ? (
          <span className="pomo-fab-countdown" style={{ color: modeColor }}>{mins}:{secs}</span>
        ) : (
          <>
            <span className="pomo-fab-emoji">🍅</span>
            <span className="pomo-fab-idle">{mins}:{secs}</span>
          </>
        )}
        {running && <span className="pomo-fab-dot" style={{ background: modeColor }} />}
      </button>

      {/* Fixed-position dropdown panel */}
      {open && (
        <div
          className="pomo-panel"
          style={{ top: panelPos.top, right: panelPos.right }}
        >
          {/* Header */}
          <div className="pomo-header">
            <span className="pomo-title">Pomodoro</span>
            <div className="pomo-sessions">
              {Array.from({ length: 4 }).map((_, i) => (
                <span key={i} className={`pomo-dot ${i < (sessions % 4) ? 'filled' : ''}`} />
              ))}
            </div>
            <button className="pomo-close" onClick={() => setOpen(false)}>✕</button>
          </div>

          {/* Mode tabs */}
          <div className="pomo-tabs">
            {Object.entries(MODES).map(([key, m]) => (
              <button
                key={key}
                className={`pomo-tab ${mode === key ? 'active' : ''}`}
                onClick={() => switchMode(key)}
                style={mode === key ? { color: m.color, borderColor: m.color } : {}}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Timer circle */}
          <div className="pomo-circle-wrap">
            <svg width="100" height="100" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r={r} fill="none" stroke="var(--color-border)" strokeWidth="6" />
              <circle
                cx="50" cy="50" r={r}
                fill="none"
                stroke={modeColor}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                transform="rotate(-90 50 50)"
                style={{ transition: 'stroke-dashoffset 0.5s linear' }}
              />
            </svg>
            <div className="pomo-time">
              <span className="pomo-digits">{mins}:{secs}</span>
              <span className="pomo-mode-label">{MODES[mode].label}</span>
            </div>
          </div>

          {/* Focus guard notice */}
          {running && mode === 'focus' && (
            <p className="pomo-guard-notice">
              🔒 Focus mode — stay in your session
            </p>
          )}
          {running && mode !== 'focus' && (
            <p className="pomo-guard-notice pomo-break-notice">
              ☕ Break time — session resumes when done
            </p>
          )}

          {/* Controls */}
          <div className="pomo-controls">
            <button className="pomo-btn-secondary" onClick={reset} title="Reset">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="1 4 1 10 7 10"/>
                <path d="M3.51 15a9 9 0 1 0 .49-4.5"/>
              </svg>
            </button>
            <button
              className="pomo-btn-primary"
              onClick={handleStartFocus}
              style={{ background: modeColor }}
            >
              {running ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
              )}
            </button>
            <button
              className="pomo-btn-secondary"
              onClick={() => {
                const keys = Object.keys(MODES);
                switchMode(keys[(keys.indexOf(mode) + 1) % keys.length]);
              }}
              title="Skip"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/>
              </svg>
            </button>
          </div>

          <p className="pomo-session-count">
            {sessions} focus session{sessions !== 1 ? 's' : ''} completed
          </p>
        </div>
      )}
    </div>
  );
};

export default PomodoroTimer;
