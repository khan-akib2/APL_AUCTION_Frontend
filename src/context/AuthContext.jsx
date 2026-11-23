'use client';
import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
const storage = typeof window !== 'undefined' ? window.sessionStorage : null;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = storage?.getItem('token');
    const u = storage?.getItem('user');
    if (t && u) {
      try {
        setToken(t);
        setUser(JSON.parse(u));
        // Verify token with backend
        fetch(`${BACKEND_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${t}` },
        })
          .then(res => {
            if (res.status === 401) {
              setToken(null);
              setUser(null);
              storage?.removeItem('token');
              storage?.removeItem('user');
              if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
                window.location.href = '/login?expired=1';
              }
            } else if (res.ok) {
              res.json().then(data => {
                if (data?.user) {
                  setUser(data.user);
                  storage?.setItem('user', JSON.stringify(data.user));
                }
              }).catch(() => {});
            }
          })
          .catch(() => {});
      } catch {
        storage?.removeItem('token');
        storage?.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = (tokenVal, userData) => {
    setToken(tokenVal);
    setUser(userData);
    storage?.setItem('token', tokenVal);
    storage?.setItem('user', JSON.stringify(userData));
  };

  const logout = async () => {
    const t = storage?.getItem('token');
    if (t) {
      try {
        await fetch(`${BACKEND_URL}/api/auth/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${t}` },
        });
      } catch { /* silent */ }
    }
    setToken(null);
    setUser(null);
    storage?.removeItem('token');
    storage?.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
