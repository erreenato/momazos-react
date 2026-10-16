import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { apiFetch } from '../api/client';
import type { User } from '../types';
import { AuthContext, type AuthContextValue, type RegisterData } from './AuthContext';
import { clearSession, saveSession } from './session';

interface AuthResponse {
  user: User;
  csrfToken: string;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Al cargar la app, la cookie (si existe) decide si hay sesión.
  useEffect(() => {
    let cancelled = false;
    apiFetch<AuthResponse>('/auth/me', { redirectOnUnauthorized: false })
      .then(({ user: sessionUser, csrfToken }) => {
        if (cancelled) return;
        saveSession(sessionUser, csrfToken);
        setUser(sessionUser);
      })
      .catch(() => {
        if (cancelled) return;
        clearSession();
        setUser(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const startSession = useCallback(({ user: sessionUser, csrfToken }: AuthResponse) => {
    saveSession(sessionUser, csrfToken);
    setUser(sessionUser);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await apiFetch<AuthResponse>('/auth/login', {
        method: 'POST',
        body: { email, password },
        redirectOnUnauthorized: false,
      });
      startSession(response);
    },
    [startSession],
  );

  const register = useCallback(
    async (data: RegisterData) => {
      const response = await apiFetch<AuthResponse>('/auth/register', {
        method: 'POST',
        body: data,
        redirectOnUnauthorized: false,
      });
      startSession(response);
    },
    [startSession],
  );

  const logout = useCallback(async () => {
    try {
      await apiFetch<void>('/auth/logout', { method: 'POST', redirectOnUnauthorized: false });
    } finally {
      clearSession();
      setUser(null);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, login, register, logout }),
    [user, loading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
