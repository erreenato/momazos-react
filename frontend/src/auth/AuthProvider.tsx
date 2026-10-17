import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { apiFetch, apiRequest, type ApiResponse } from '../api/client';
import type { User } from '../types';
import { AuthContext, type AuthContextValue, type RegisterData } from './AuthContext';
import { clearSession, readSession, saveSession } from './session';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  // Solo hay algo que cargar si quedó una sesión guardada de antes.
  const [loading, setLoading] = useState(() => readSession() !== null);

  // Al recargar la página no podemos leer la cookie httpOnly, así que le preguntamos al servidor
  // si la sesión sigue vigente. Sin csrfToken guardado no hay sesión que restaurar.
  useEffect(() => {
    const stored = readSession();
    if (!stored) return;

    let cancelled = false;
    apiFetch<User>('/auth/me', { redirectOnUnauthorized: false })
      .then((sessionUser) => {
        if (cancelled) return;
        saveSession(sessionUser, stored.csrfToken);
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

  // El backend entrega el token CSRF en el header X-CSRF-Token y los datos del usuario en el body.
  const startSession = useCallback(({ data: sessionUser, headers }: ApiResponse<User>) => {
    const csrfToken = headers.get('X-CSRF-Token');
    if (!csrfToken) {
      throw new Error('El servidor no envió el token CSRF');
    }
    saveSession(sessionUser, csrfToken);
    setUser(sessionUser);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await apiRequest<User>('/auth/login', {
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
      const response = await apiRequest<User>('/auth/register', {
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
