/**
 * Settings context
 * @module popup/SettingsContext
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { sendToBackground } from '../services/apiService.js';
import { MESSAGES } from '../../shared/constants/messages.js';

const SettingsContext = createContext(null);

const DEFAULT_SETTINGS = {
  theme: 'light',
  autoSave: true,
  showNotifications: true,
  defaultExportFormat: 'csv',
  requestDelay: 1000,
  debugMode: false,
};

/**
 * @param {{ children: React.ReactNode }} props
 */
export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    sendToBackground(MESSAGES.SETTINGS_GET, {})
      .then(res => { if (res?.success) setSettings(res.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const updateSetting = useCallback(async (key, value) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    try {
      await sendToBackground(MESSAGES.SETTINGS_SET, { settings: updated });
    } catch {}
  }, [settings]);

  const resetSettings = useCallback(async () => {
    setSettings(DEFAULT_SETTINGS);
    try {
      await sendToBackground(MESSAGES.SETTINGS_RESET, {});
    } catch {}
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, loading, updateSetting, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

/**
 * @returns {{ settings: object, updateSetting: Function, resetSettings: Function }}
 */
export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}

export default SettingsContext;
