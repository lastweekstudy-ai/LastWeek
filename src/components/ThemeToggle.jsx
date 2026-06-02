import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import '../styles/ThemeToggle.css';

const COLOR_META = {
  purple: { name: 'Purple', icon: '🟣' },
  orange: { name: 'Orange', icon: '🟠' },
  green:  { name: 'Green',  icon: '🟢' },
  brown:  { name: 'Brown',  icon: '🟤' },
  blue:   { name: 'Blue',   icon: '🔵' }
};

const ThemeToggle = () => {
  const { color, changeColor, availableColors } = useTheme();
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
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const currentIcon = COLOR_META[color]?.icon ?? '🟣';

  return (
    <div className="theme-toggle-container" ref={dropdownRef}>
      <button
        className="theme-toggle"
        onClick={() => setIsOpen(prev => !prev)}
        aria-label="Change color theme"
        title="Change color theme"
      >
        <span className="theme-icon">{currentIcon}</span>
      </button>

      {isOpen && (
        <div className="theme-dropdown">
          {availableColors.map((key) => {
            const meta = COLOR_META[key];
            return (
              <button
                key={key}
                className={`theme-option ${color === key ? 'active' : ''}`}
                onClick={() => {
                  changeColor(key);
                  setIsOpen(false);
                }}
                aria-label={`Switch to ${meta.name} theme`}
              >
                <span className="theme-option-icon">{meta.icon}</span>
                <span className="theme-option-name">{meta.name}</span>
                {color === key && <span className="theme-option-check">✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ThemeToggle;
