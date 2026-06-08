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
    document.documentElement.setAttribute('data-color', color);
    localStorage.setItem('lastweek-color', color);
  }, [color]);

  useEffect(() => {
    // Apply dark/light mode to document
    document.documentElement.setAttribute('data-theme', mode);
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
