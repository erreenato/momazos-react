import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { AUTH_COOKIE_NAME, CSRF_HEADER_NAME, getJwtSecret } from '../config/auth.js';
import type { IUser } from '../models/User.js';

export type Role = IUser['role'];

export interface AuthUser {
  id: string;
  role: Role;
}

export interface JwtPayload {
  sub: string;
  role: Role;
  csrf: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

const isJwtPayload = (value: unknown): value is JwtPayload => {
  if (typeof value !== 'object' || value === null) return false;
  const payload = value as Record<string, unknown>;
  return (
    typeof payload.sub === 'string' &&
    (payload.role === 'user' || payload.role === 'moderator') &&
    typeof payload.csrf === 'string'
  );
};

/**
 * Exige una sesión válida: JWT en la cookie httpOnly y el header X-CSRF-Token
 * igual al csrfToken guardado dentro del JWT. Deja la sesión en `req.user`.
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  const token: unknown = req.cookies?.[AUTH_COOKIE_NAME];
  if (typeof token !== 'string' || token === '') {
    res.status(401).json({ error: 'No autenticado' });
    return;
  }

  let payload: unknown;
  try {
    payload = jwt.verify(token, getJwtSecret());
  } catch {
    res.status(401).json({ error: 'Sesión inválida o expirada' });
    return;
  }

  if (!isJwtPayload(payload)) {
    res.status(401).json({ error: 'Sesión inválida o expirada' });
    return;
  }

  // Un sitio externo puede hacer que el navegador mande la cookie, pero no puede leer
  // el csrfToken (vive en el localStorage de nuestro origen), así que no puede mandar este header.
  if (req.get(CSRF_HEADER_NAME) !== payload.csrf) {
    res.status(401).json({ error: 'Token CSRF inválido' });
    return;
  }

  req.user = { id: payload.sub, role: payload.role };
  next();
};

/** Debe usarse después de `requireAuth`. Responde 403 si el rol no está permitido. */
export const requireRole =
  (...roles: Role[]) =>
    (req: Request, res: Response, next: NextFunction): void => {
      if (!req.user) {
        res.status(401).json({ error: 'No autenticado' });
        return;
      }
      if (!roles.includes(req.user.role)) {
        res.status(403).json({ error: 'No tienes permisos para esta acción' });
        return;
      }
      next();
    };


/**
 * Identifica al usuario si tiene una sesión válida.
 * Permite continuar cuando no hay sesión.
 */
export const optionalAuth = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const token: unknown = req.cookies?.[AUTH_COOKIE_NAME];

  if (typeof token !== 'string' || token === '') {
    next();
    return;
  }

  let payload: unknown;

  try {
    payload = jwt.verify(token, getJwtSecret());
  } catch {
    res.status(401).json({ error: 'Sesión inválida o expirada' });
    return;
  }

  if (!isJwtPayload(payload)) {
    res.status(401).json({ error: 'Sesión inválida o expirada' });
    return;
  }

  if (req.get(CSRF_HEADER_NAME) !== payload.csrf) {
    res.status(401).json({ error: 'Token CSRF inválido' });
    return;
  }

  req.user = {
    id: payload.sub,
    role: payload.role,
  };

  next();
};

