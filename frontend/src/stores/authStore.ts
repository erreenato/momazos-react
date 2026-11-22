import { create } from 'zustand';
import { apiFetch, apiRequest, setUnauthorizedHandler, toStoreError, type ApiResponse } from '../api/client';
import { clearSession, readSession, saveSession } from '../auth/session';
import type { StoreError, User } from '../types';
import { useMemeStore } from './memeStore';

export interface RegisterData {
  username: string;
  email: string;
  password: string;
}

/**
 * - `restoring`: hay una sesión guardada y se está validando con GET /auth/me (tras un F5).
 * - `ready`: ya se sabe si hay usuario o no.
 */
export type AuthStatus = 'restoring' | 'ready';

interface AuthState {
  /** Usuario en sesión. Única fuente de verdad del frontend: nadie más guarda una copia. */
  user: User | null;
  status: AuthStatus;
  /** Último error de login/registro/restauración. */
  error: StoreError | null;

  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  /** Pregunta al servidor si la cookie sigue vigente. Se llama una vez al montar la app. */
  restoreSession: () => Promise<void>;
  /** Reemplaza los datos del usuario en sesión (p. ej. después de editar el perfil). */
  setUser: (user: User) => void;
  clearError: () => void;
}

// Evita pedir /auth/me dos veces (StrictMode monta los efectos dos veces en desarrollo).
let restorePromise: Promise<void> | null = null;

/** Al cambiar de usuario, los memes cacheados traen `myReaction` y pendientes del anterior. */
function resetUserScopedData() {
  useMemeStore.getState().reset();
}

function startSession({ data: user, headers }: ApiResponse<User>): User {
  // El backend entrega el token CSRF en el header X-CSRF-Token y el usuario en el body.
  const csrfToken = headers.get('X-CSRF-Token');
  if (!csrfToken) {
    throw new Error('El servidor no envió el token CSRF');
  }
  saveSession(user, csrfToken);
  return user;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  // Solo hay algo que restaurar si quedó una sesión guardada de antes.
  status: readSession() ? 'restoring' : 'ready',
  error: null,

  login: async (email, password) => {
    set({ error: null });
    try {
      const response = await apiRequest<User>('/auth/login', {
        method: 'POST',
        body: { email, password },
        redirectOnUnauthorized: false,
      });
      const user = startSession(response);
      resetUserScopedData();
      set({ user, status: 'ready' });
    } catch (error) {
      set({ error: toStoreError(error, 'No se pudo iniciar sesión.') });
      throw error;
    }
  },

  register: async (data) => {
    set({ error: null });
    try {
      const response = await apiRequest<User>('/auth/register', {
        method: 'POST',
        body: data,
        redirectOnUnauthorized: false,
      });
      const user = startSession(response);
      resetUserScopedData();
      set({ user, status: 'ready' });
    } catch (error) {
      set({ error: toStoreError(error, 'No se pudo crear la cuenta.') });
      throw error;
    }
  },

  logout: async () => {
    try {
      await apiFetch<void>('/auth/logout', { method: 'POST', redirectOnUnauthorized: false });
    } finally {
      clearSession();
      resetUserScopedData();
      set({ user: null, status: 'ready', error: null });
    }
  },

  restoreSession: () => {
    if (restorePromise) return restorePromise;

    const stored = readSession();
    if (!stored) {
      set({ status: 'ready' });
      return Promise.resolve();
    }

    set({ status: 'restoring' });
    // No podemos leer la cookie httpOnly, así que le preguntamos al servidor si la sesión sigue vigente.
    restorePromise = apiFetch<User>('/auth/me', { redirectOnUnauthorized: false })
      .then((user) => {
        saveSession(user, stored.csrfToken);
        set({ user, status: 'ready', error: null });
      })
      .catch(() => {
        clearSession();
        set({ user: null, status: 'ready' });
      })
      .finally(() => {
        restorePromise = null;
      });
    return restorePromise;
  },

  setUser: (user) => {
    const current = get().user;
    const stored = readSession();
    if (current && stored) saveSession(user, stored.csrfToken);
    set({ user });
  },

  clearError: () => set({ error: null }),
}));

// Si cualquier petición recibe un 401, el servidor ya no reconoce la sesión:
// se limpia el usuario en memoria para no mostrar datos contradictorios.
setUnauthorizedHandler(() => {
  resetUserScopedData();
  useAuthStore.setState({ user: null, status: 'ready' });
});

// Selectores reutilizables.
export const selectUser = (state: AuthState) => state.user;
export const selectIsModerator = (state: AuthState) => state.user?.role === 'moderator';
export const selectAuthLoading = (state: AuthState) => state.status === 'restoring';
