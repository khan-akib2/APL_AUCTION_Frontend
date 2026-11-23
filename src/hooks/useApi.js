'use client';
import { useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

export function useApi() {
  const { token, logout } = useAuth();

  const request = useCallback(async (path, options = {}) => {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const url = `${BACKEND_URL}${normalizedPath}`;

    try {
      const res = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...options.headers,
        },
      });

      if (res.status === 401) {
        logout?.();
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
          window.location.href = '/login?expired=1';
        }
        return null;
      }

      return await res.json();
    } catch (err) {
      console.error(`API error on ${url}:`, err);
      return null;
    }
  }, [token, logout]);

  return { request };
}
