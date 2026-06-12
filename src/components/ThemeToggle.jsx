import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';

const COLOR_META = {
  purple: { name: 'Purple', hex: '#7c3aed' },
  orange: { name: 'Orange', hex: '#ea580c' },
  green: { name: 'Green', hex: '#16a34a' },
  brown: { name: 'Brown', hex: '#92400e' },
  blue: { name: 'Blue', hex: '#2563eb' },
};

const ThemeToggle = () => {
  const { color, changeColor, availableColors } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

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

  const currentHex = COLOR_META[color]?.hex || COLOR_META.purple.hex;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className="btn-ghost flex h-9 w-9 items-center justify-center rounded-full"
        onClick={() => setIsOpen((open) => !open)}
        aria-label="Change color theme"
        title="Change color theme"
      >
        <span className="theme-swatch" style={{ backgroundColor: currentHex }} />
      </button>

      {isOpen && (
        <div className="glass absolute bottom-full left-0 z-50 mb-2 w-52 rounded-xl p-1 shadow-glow-sm">
          {availableColors.map((key) => {
            const meta = COLOR_META[key] || COLOR_META.purple;
            return (
              <button
                key={key}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                  color === key
                    ? 'bg-brand-600/15 text-brand-300'
                    : 'text-surface-600 hover:bg-brand-100 hover:text-surface-900 dark:text-surface-200 dark:hover:bg-surface-700/60 dark:hover:text-white'
                }`}
                onClick={() => {
                  changeColor(key);
                  setIsOpen(false);
                }}
                aria-label={`Switch to ${meta.name} theme`}
              >
                <span className="theme-swatch theme-option-icon" style={{ backgroundColor: meta.hex }} />
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
