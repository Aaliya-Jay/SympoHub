import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { apiRequest } from '../lib/api';

const AuthContext = createContext(null);

function readStoredUser() {
  try {
    const stored = localStorage.getItem('sympohub_user');
    return stored ? JSON.parse(stored) : null;
  } catch {
    localStorage.removeItem('sympohub_user');
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);
  const [token, setToken] = useState(() => localStorage.getItem('sympohub_token'));

  const persistSession = useCallback(({ user: nextUser, token: nextToken }) => {
    localStorage.setItem('sympohub_token', nextToken);
    localStorage.setItem('sympohub_user', JSON.stringify(nextUser));
    setToken(nextToken);
    setUser(nextUser);
    return nextUser;
  }, []);

  const login = useCallback(async credentials => {
    return persistSession(await apiRequest('/auth/login', { method: 'POST', data: credentials }));
  }, [persistSession]);

  const register = useCallback(async details => {
    return persistSession(await apiRequest('/auth/register', { method: 'POST', data: details }));
  }, [persistSession]);

  const logout = useCallback(() => {
    localStorage.removeItem('sympohub_token');
    localStorage.removeItem('sympohub_user');
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, token, isAuthenticated: Boolean(token && user), login, register, logout }), [user, token, login, register, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider.');
  return context;
}
