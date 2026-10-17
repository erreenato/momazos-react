import { clearSession, readSession } from '../auth/session';

export const API_URL: string = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  /** Por defecto, un 401 limpia la sesión y redirige a /login. Login y /auth/me lo desactivan. */
  redirectOnUnauthorized?: boolean;
}

const AUTH_PAGES = ['/login', '/registro'];

function redirectToLogin(): void {
  clearSession();
  if (!AUTH_PAGES.includes(window.location.pathname)) {
    window.location.assign('/login');
  }
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const data: unknown = await response.json();
    if (typeof data === 'object' && data !== null && 'error' in data && typeof data.error === 'string') {
      return data.error;
    }
  } catch {
    // La respuesta no era JSON.
  }
  return `Error ${response.status}`;
}

export interface ApiResponse<T> {
  data: T;
  headers: Headers;
}

/**
 * Cliente compartido para hablar con el backend:
 * - `credentials: 'include'` para que el navegador mande la cookie httpOnly con el JWT.
 * - Header `X-CSRF-Token` con el token guardado en localStorage.
 * - Ante un 401 redirige a /login.
 * Devuelve también los headers de la respuesta.
 */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
  const { method = 'GET', body, redirectOnUnauthorized = true } = options;

  const headers: Record<string, string> = {};
  if (body !== undefined && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  } const csrfToken = readSession()?.csrfToken;
  if (csrfToken) headers['X-CSRF-Token'] = csrfToken;

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    credentials: 'include',
    body:
      body === undefined
        ? undefined
        : body instanceof FormData
          ? body
          : JSON.stringify(body),
  });

  if (response.status === 401 && redirectOnUnauthorized) {
    redirectToLogin();
  }

  if (!response.ok) {
    throw new ApiError(response.status, await readErrorMessage(response));
  }

  const data = response.status === 204 ? (undefined as T) : ((await response.json()) as T);
  return { data, headers: response.headers };
}

/** Igual que `apiRequest`, pero devuelve solo el body. */
export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { data } = await apiRequest<T>(path, options);
  return data;
}