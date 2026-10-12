import { createContext, useContext, useEffect, useState } from 'react';
import { getToken, getUser, persistSession, clearSession } from '../services/auth.js';
import { api } from '../services/api.js';

export const AuthCtx = createContext({ token: null, user: null, setAuth: () => {}, clearAuth: () => {} });

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getToken());
  const [user, setUser] = useState(() => getUser());

  useEffect(() => {
    let cancelled = false;
    api('/api/v1/auth/refresh', { method: 'POST' })
      .then(({ access_token: restoredToken }) => api('/api/v1/auth/me', { token: restoredToken })
        .then(restoredUser => {
          if (cancelled) return;
          persistSession(restoredToken, restoredUser);
          setToken(restoredToken);
          setUser(restoredUser);
        }))
      .catch(() => {
        if (!cancelled) clearSession();
      });
    return () => { cancelled = true; };
  }, []);

  const setAuth = (tk, u) => { persistSession(tk, u); setToken(tk); setUser(u); };
  const clearAuth = () => { clearSession(); setToken(null); setUser(null); };

  return (
    <AuthCtx.Provider value={{ token, user, setAuth, clearAuth }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  return useContext(AuthCtx);
}
