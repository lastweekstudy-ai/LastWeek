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

  useEffect(() => {
    // Apply color to document (always dark mode)
    document.documentElement.setAttribute('data-color', color);
    localStorage.setItem('lastweek-color', color);
  }, [color]);

  const changeColor = (newColor) => {
    if (AVAILABLE_COLORS.includes(newColor)) {
      setColor(newColor);
    }
  };

  const value = {
    color,
    changeColor,
    availableColors: AVAILABLE_COLORS
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
