import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

const AVAILABLE_COLORS = ['purple', 'orange', 'green', 'brown', 'blue'];

const COLOR_PALETTES = {
  purple: {
    accent: '#7c3aed',
    accentHover: '#8b5cf6',
    accentSoft: '#ede9fe',
    accentText: '#6d28d9',
  },
  orange: {
    accent: '#ea580c',
    accentHover: '#f97316',
    accentSoft: '#ffedd5',
    accentText: '#c2410c',
  },
  green: {
    accent: '#16a34a',
    accentHover: '#22c55e',
    accentSoft: '#dcfce7',
    accentText: '#15803d',
  },
  brown: {
    accent: '#92400e',
    accentHover: '#b45309',
    accentSoft: '#fef3c7',
    accentText: '#78350f',
  },
  blue: {
    accent: '#2563eb',
    accentHover: '#3b82f6',
    accentSoft: '#dbeafe',
    accentText: '#1d4ed8',
  },
};

export const ThemeProvider = ({ children }) => {
  const [color, setColor] = useState(() => {
    // Check localStorage first, default to purple
    const savedColor = localStorage.getItem('lastweek-color');
    if (savedColor && AVAILABLE_COLORS.includes(savedColor)) {
      return savedColor;
    }
    return 'purple';
  });

  const [mode, setMode] = useState(() => {
    // Check localStorage first, default to dark
    const savedMode = localStorage.getItem('lastweek-theme');
    if (savedMode && (savedMode === 'dark' || savedMode === 'light')) {
      return savedMode;
    }
    return 'dark';
  });

  useEffect(() => {
    // Apply color to document (light mode)
    const palette = COLOR_PALETTES[color] || COLOR_PALETTES.purple;
    document.documentElement.setAttribute('data-color', color);
    document.documentElement.style.setProperty('--color-accent', palette.accent);
    document.documentElement.style.setProperty('--color-accent-hover', palette.accentHover);
    document.documentElement.style.setProperty('--color-accent-soft', palette.accentSoft);
    document.documentElement.style.setProperty('--color-accent-text', palette.accentText);
    localStorage.setItem('lastweek-color', color);
  }, [color]);

  useEffect(() => {
    // Apply dark/light mode to document
    document.documentElement.setAttribute('data-theme', mode);
    document.documentElement.classList.toggle('dark', mode === 'dark');
    localStorage.setItem('lastweek-theme', mode);
  }, [mode]);

  const changeColor = (newColor) => {
    if (AVAILABLE_COLORS.includes(newColor)) {
      setColor(newColor);
    }
  };

  const toggleMode = () => {
    setMode(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const value = {
    color,
    changeColor,
    availableColors: AVAILABLE_COLORS,
    mode,
    toggleMode
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
