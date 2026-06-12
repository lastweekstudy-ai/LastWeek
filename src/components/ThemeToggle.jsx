import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';

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
    <div className="relative" ref={dropdownRef}>
      <button
        className="btn-ghost flex h-9 w-9 items-center justify-center rounded-full"
        onClick={() => setIsOpen(prev => !prev)}
        aria-label="Change color theme"
        title="Change color theme"
      >
        <span className="theme-icon">{currentIcon}</span>
      </button>

      {isOpen && (
        <div className="glass absolute bottom-full left-0 z-50 mb-2 w-52 rounded-xl p-1 shadow-glow-sm">
          {availableColors.map((key) => {
            const meta = COLOR_META[key];
            return (
              <button
                key={key}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${color === key ? 'bg-brand-600/15 text-brand-300' : 'text-surface-600 hover:bg-brand-100 hover:text-surface-900 dark:text-surface-200 dark:hover:bg-surface-700/60 dark:hover:text-white'}`}
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
