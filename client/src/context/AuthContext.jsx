import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, tokenStore } from '../services/api.js';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!tokenStore.get());

  useEffect(() => {
    if (!tokenStore.get()) return;
    api.me().then((r) => setUser(r.data.user)).catch(() => tokenStore.clear()).finally(() => setLoading(false));
  }, []);
  useEffect(() => { const h = () => setUser(null); window.addEventListener('parkease:logout', h); return () => window.removeEventListener('parkease:logout', h); }, []);

  const authenticate = useCallback(async (fn, payload) => { const r = await fn(payload); tokenStore.set(r.data.token); setUser(r.data.user); return r.data.user; }, []);
  const value = useMemo(() => ({
    user, loading, setUser,
    login: (d) => authenticate(api.login, d),
    register: (d) => authenticate(api.register, d),
    logout: () => { tokenStore.clear(); setUser(null); },
  }), [user, loading, authenticate]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
