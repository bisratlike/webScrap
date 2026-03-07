/**
 * App wrapper with context providers
 */

import React from 'react';
import { ScraperProvider } from '../context/ScraperContext.jsx';
import { SettingsProvider } from '../context/SettingsContext.jsx';
import { ThemeProvider } from '../context/ThemeContext.jsx';
import IndexPage from './index.jsx';

export default function App() {
  return (
    <ThemeProvider>
      <SettingsProvider>
        <ScraperProvider>
          <IndexPage />
        </ScraperProvider>
      </SettingsProvider>
    </ThemeProvider>
  );
}
