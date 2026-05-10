import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { UserIcon, LogoutIcon, SettingsIcon } from './Icons';
import '../styles/ProfileDropdown.css';

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
    <div className="profile-dropdown" ref={dropdownRef}>
      <button
        className="profile-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="User menu"
        aria-expanded={isOpen}
      >
        <div className="profile-avatar">
          {getUserInitials()}
        </div>
        <span className="profile-name">{getUserDisplayName()}</span>
        <svg 
          width="16" 
          height="16" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
          className={`profile-chevron ${isOpen ? 'open' : ''}`}
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {isOpen && (
        <div className="profile-menu">
          <div className="profile-menu-header">
            <div className="profile-avatar-large">
              {getUserInitials()}
            </div>
            <div className="profile-info">
              <div className="profile-info-name">{getUserDisplayName()}</div>
              <div className="profile-info-email">{user?.email || 'No email'}</div>
              {isGuest && <div className="profile-info-badge">Guest Account</div>}
            </div>
          </div>

          <div className="profile-menu-divider" />

          <div className="profile-menu-section">
            <button
              className="profile-menu-item"
              onClick={handleSettings}
            >
              <SettingsIcon size={18} />
              <span>Settings</span>
            </button>

            <button
              className="profile-menu-item"
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
              className="profile-menu-item"
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

          <div className="profile-menu-divider" />

          <div className="profile-menu-section">
            <button
              className="profile-menu-item profile-menu-item-danger"
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
