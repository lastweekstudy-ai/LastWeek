import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { UserIcon, LogoutIcon, SettingsIcon } from './Icons';

const ProfileDropdown = () => {
  const { user, logout, isGuest } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
      alert('Logout failed: ' + error.message);
    }
  };

  const handleSettings = () => {
    setIsOpen(false);
    navigate('/settings');
  };

  const getUserInitials = () => {
    if (!user) return '?';
    const name = user.name || user.email || 'User';
    return name.charAt(0).toUpperCase();
  };

  const getUserDisplayName = () => {
    if (isGuest) return 'Guest User';
    return user?.name || user?.email || 'User';
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        className="flex w-full items-center gap-3 rounded-2xl border border-surface-200 bg-white px-3 py-2 text-left text-sm shadow-soft transition hover:border-brand-300 hover:bg-brand-50 focus:outline-none focus:ring-2 focus:ring-brand-500/40 dark:border-surface-800 dark:bg-surface-900 dark:hover:border-brand-500/50 dark:hover:bg-surface-800"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="User menu"
        aria-expanded={isOpen}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-sm font-bold text-white shadow-soft">
          {getUserInitials()}
        </div>
        <span className="min-w-0 flex-1 truncate font-semibold text-surface-900 dark:text-white">{getUserDisplayName()}</span>
        <svg 
          width="16" 
          height="16" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
          className={`shrink-0 text-surface-500 transition-transform dark:text-surface-400 ${isOpen ? 'rotate-180' : ''}`}
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 z-50 mb-3 max-h-[min(24rem,calc(100vh-8rem))] w-full min-w-64 overflow-y-auto overscroll-contain rounded-2xl border border-surface-200 bg-white p-2 shadow-strong dark:border-surface-800 dark:bg-surface-950">
          <div className="flex items-center gap-3 rounded-xl bg-surface-50 p-3 dark:bg-surface-900">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-base font-bold text-white">
              {getUserInitials()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-surface-950 dark:text-white">{getUserDisplayName()}</div>
              <div className="truncate text-xs text-surface-500 dark:text-surface-400">{user?.email || 'No email'}</div>
              {isGuest && <div className="mt-2 inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:bg-amber-500/15 dark:text-amber-200">Guest Account</div>}
            </div>
          </div>

          <div className="my-2 h-px bg-surface-200 dark:bg-surface-800" />

          <div className="space-y-1">
            <button
              className="nav-item w-full justify-start"
              onClick={handleSettings}
            >
              <SettingsIcon size={18} />
              <span>Settings</span>
            </button>

            <button
              className="nav-item w-full justify-start"
              onClick={() => {
                setIsOpen(false);
                navigate('/dashboard');
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7"/>
                <rect x="14" y="3" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/>
                <rect x="3" y="14" width="7" height="7"/>
              </svg>
              <span>Dashboard</span>
            </button>

            <button
              className="nav-item w-full justify-start"
              onClick={() => {
                setIsOpen(false);
                navigate('/mode-select');
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span>New Session</span>
            </button>
          </div>

          <div className="my-2 h-px bg-surface-200 dark:bg-surface-800" />

          <div className="space-y-1">
            <button
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500/30 dark:text-red-300 dark:hover:bg-red-500/10"
              onClick={handleLogout}
            >
              <LogoutIcon size={18} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileDropdown;
