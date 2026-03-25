import { createContext, useContext, useState } from 'react';
import { getToken, getUser } from '../services/auth.js';

export const AuthCtx = createContext({ token: null, user: null, setAuth: () => {}, clearAuth: () => {} });

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getToken());
  const [user, setUser] = useState(() => getUser());

  const setAuth = (tk, u) => { setToken(tk); setUser(u); };
  const clearAuth = () => { setToken(null); setUser(null); };

  return (
    <AuthCtx.Provider value={{ token, user, setAuth, clearAuth }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  return useContext(AuthCtx);
}
