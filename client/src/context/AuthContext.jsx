import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { api, setToken, clearToken, isBackendEnabled } from '../services/api';
import { apiLogout } from '../services/posApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [staff, setStaff] = useState(null);
  const [venue, setVenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const backendEnabled = isBackendEnabled();

  // Try to restore session on mount (via refresh token cookie)
  useEffect(() => {
    if (!backendEnabled) {
      setLoading(false);
      return;
    }

    api.post('/api/auth/refresh')
      .then((data) => {
        setToken(data.token);
        return api.get('/api/auth/me');
      })
      .then((data) => {
        setStaff(data.staff);
        setVenue(data.venue);
      })
      .catch(() => {
        // No valid session — user needs to log in
      })
      .finally(() => setLoading(false));
  }, [backendEnabled]);

  const login = useCallback(async (pin, venueId) => {
    const data = await api.post('/api/auth/login', { pin, venueId });
    setToken(data.token);
    setStaff(data.staff);

    // Fetch venue info
    const meData = await api.get('/api/auth/me');
    setVenue(meData.venue);

    return data.staff;
  }, []);

  const logout = useCallback(async () => {
    try { await apiLogout(); } catch { /* best-effort cookie clear */ }
    clearToken();
    setStaff(null);
    setVenue(null);
  }, []);

  const value = {
    staff,
    venue,
    loading,
    backendEnabled,
    isAuthenticated: !!staff,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
