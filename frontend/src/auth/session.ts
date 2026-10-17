import type { User } from '../types';

/**
 * Lo único que se guarda en localStorage. El JWT NUNCA pasa por aquí:
 * vive en una cookie httpOnly que JavaScript no puede leer.
 */
export interface StoredSession {
  username: string;
  role: User['role'];
  avatarUrl?: string;
  csrfToken: string;
}

const STORAGE_KEY = 'momazos.session';

export function readSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredSession) : null;
  } catch {
    return null;
  }
}

export function saveSession(user: User, csrfToken: string): void {
  const session: StoredSession = {
    username: user.username,
    role: user.role,
    avatarUrl: user.avatarUrl,
    csrfToken,
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Sin localStorage (modo privado, almacenamiento bloqueado): la sesión sigue en la cookie.
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nada que limpiar.
  }
}
