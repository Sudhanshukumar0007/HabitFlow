import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';
const AuthContext = createContext(null);

// ── Module-level access token (in-memory, not localStorage) ──────────────────
// This survives re-renders but is cleared on full page refresh (forces re-auth via cookie)
let _accessToken = null;

export const getAccessToken = () => _accessToken;
export const setAccessToken = (t) => { _accessToken = t; };

// ── AuthProvider ──────────────────────────────────────────────────────────────
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const refreshTimerRef = useRef(null);

  // Silently refresh the access token using the httpOnly cookie
  const silentRefresh = useCallback(async () => {
    try {
      const res = await axios.post(
        `${BASE_URL}/auth/refresh`,
        {},
        { withCredentials: true } // sends the httpOnly cookie
      );
      const { accessToken, user: userData } = res.data;
      setAccessToken(accessToken);
      setUser(userData);
      scheduleRefresh(); // schedule next refresh
      return accessToken;
    } catch {
      // Refresh token expired or missing — user must log in again
      setAccessToken(null);
      setUser(null);
      return null;
    }
  }, []);

  // Schedule silent refresh 30s before the 15-min access token expires
  const scheduleRefresh = useCallback(() => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    refreshTimerRef.current = setTimeout(() => {
      silentRefresh();
    }, (15 * 60 - 30) * 1000); // 14m 30s
  }, [silentRefresh]);

  // On mount — try to restore session via refresh cookie
  useEffect(() => {
    silentRefresh().finally(() => setLoading(false));
    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, []);

  const login = useCallback((accessToken, userData) => {
    setAccessToken(accessToken);
    setUser(userData);
    scheduleRefresh();
  }, [scheduleRefresh]);

  const logout = useCallback(async () => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    setAccessToken(null);
    setUser(null);
    // Tell server to clear the httpOnly cookie
    try {
      await axios.post(`${BASE_URL}/auth/logout`, {}, { withCredentials: true });
    } catch { /* ignore */ }
  }, []);

  const updateUser = useCallback((data) => setUser((prev) => ({ ...prev, ...data })), []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser, silentRefresh }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
