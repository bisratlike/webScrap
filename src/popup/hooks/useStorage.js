/**
 * Custom hook for storage operations
 * @module popup/useStorage
 */

import { useState, useEffect, useCallback } from 'react';
import { listSessions, sendToBackground } from '../services/apiService.js';
import { MESSAGES } from '../../shared/constants/messages.js';

/**
 * @returns {{ sessions: Array, currentSession: object|null, loadSessions: Function, saveSession: Function, loading: boolean }}
 */
export function useStorage() {
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadSessions = useCallback(async () => {
    setLoading(true);
    try {
      const list = await listSessions();
      setSessions(list);
    } catch {
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveSession = useCallback(async (session) => {
    try {
      const res = await sendToBackground(MESSAGES.SESSION_UPDATE, { sessionId: session.id, updates: session });
      if (res?.success) {
        await loadSessions();
        return res.data;
      }
    } catch {}
    return null;
  }, [loadSessions]);

  useEffect(() => { loadSessions(); }, [loadSessions]);

  return { sessions, currentSession, setCurrentSession, loadSessions, saveSession, loading };
}
