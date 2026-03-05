/**
 * Theme context for light/dark mode
 * @module popup/ThemeContext
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

/**
 * @param {{ children: React.ReactNode }} props
 */
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light');

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * @returns {{ theme: string, toggleTheme: Function }}
 */
export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

export default ThemeContext;
