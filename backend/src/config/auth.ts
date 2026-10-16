import type { CookieOptions } from 'express';

export const AUTH_COOKIE_NAME = 'token';
export const CSRF_HEADER_NAME = 'x-csrf-token';
export const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 días

const isProduction = process.env.NODE_ENV === 'production';

// En desarrollo frontend y backend viven en localhost (mismo sitio), así que basta con 'lax'.
// En producción suelen estar en dominios distintos: la cookie necesita 'none' + secure (HTTPS).
export const authCookieOptions: CookieOptions = {
  httpOnly: true, // JavaScript no puede leer la cookie: mitiga el robo del token por XSS
  sameSite: isProduction ? 'none' : 'lax',
  secure: isProduction,
  path: '/',
};

export const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('Falta la variable de entorno JWT_SECRET');
  }
  return secret;
};
