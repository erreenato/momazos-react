import { randomBytes } from 'node:crypto';
import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {
  AUTH_COOKIE_NAME,
  SESSION_DURATION_MS,
  authCookieOptions,
  getJwtSecret,
} from '../config/auth.js';
import type { JwtPayload } from '../middleware/auth.js';
import { User, type IUser } from '../models/User.js';
import { toPublicUser } from '../utils/serializers.js';

const BCRYPT_ROUNDS = 10;
const MIN_PASSWORD_LENGTH = 6;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const readString = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

/**
 * Crea la sesión: firma un JWT que incluye un csrfToken nuevo, lo deja en una cookie httpOnly
 * y devuelve el csrfToken (para el header X-CSRF-Token) junto a los datos públicos del usuario.
 */
const startSession = (res: Response, user: IUser, status: number): void => {
  const csrfToken = randomBytes(32).toString('hex');
  const payload: JwtPayload = { sub: String(user._id), role: user.role, csrf: csrfToken };
  const token = jwt.sign(payload, getJwtSecret(), { expiresIn: SESSION_DURATION_MS / 1000 });

  res.cookie(AUTH_COOKIE_NAME, token, { ...authCookieOptions, maxAge: SESSION_DURATION_MS });
  res.status(status).json({ user: toPublicUser(user), csrfToken });
};

// POST /api/auth/register
export const register = async (req: Request, res: Response): Promise<void> => {
  const username = readString(req.body?.username);
  const email = readString(req.body?.email).toLowerCase();
  const password: unknown = req.body?.password;

  if (!username || !email || typeof password !== 'string') {
    res.status(400).json({ error: 'username, email y password son obligatorios' });
    return;
  }
  if (!EMAIL_REGEX.test(email)) {
    res.status(400).json({ error: 'El email no es válido' });
    return;
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    res.status(400).json({ error: `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres` });
    return;
  }

  const existing = await User.findOne({ $or: [{ username }, { email }] });
  if (existing) {
    const field = existing.username === username ? 'nombre de usuario' : 'email';
    res.status(409).json({ error: `Ese ${field} ya está registrado` });
    return;
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  // El rol nunca se toma del body: todos los registros son 'user'.
  const user = await User.create({ username, email, passwordHash });

  startSession(res, user, 201);
};

// POST /api/auth/login
export const login = async (req: Request, res: Response): Promise<void> => {
  const email = readString(req.body?.email).toLowerCase();
  const password: unknown = req.body?.password;

  if (!email || typeof password !== 'string' || password === '') {
    res.status(400).json({ error: 'email y password son obligatorios' });
    return;
  }

  const user = await User.findOne({ email });
  // Mismo mensaje si no existe el usuario o si la contraseña es incorrecta,
  // para no revelar qué emails están registrados.
  const valid = user !== null && (await bcrypt.compare(password, user.passwordHash));
  if (!user || !valid) {
    res.status(401).json({ error: 'Credenciales inválidas' });
    return;
  }

  startSession(res, user, 200);
};

// POST /api/auth/logout
export const logout = (_req: Request, res: Response): void => {
  res.clearCookie(AUTH_COOKIE_NAME, authCookieOptions);
  res.status(204).end();
};

// GET /api/auth/me (requireAuth)
export const me = async (req: Request, res: Response): Promise<void> => {
  const user = req.user ? await User.findById(req.user.id) : null;
  if (!user) {
    res.status(401).json({ error: 'No autenticado' });
    return;
  }

  // Se devuelve también el csrfToken de la sesión para que el frontend pueda recuperarlo
  // si se borró su localStorage. Otro origen no puede leer esta respuesta (CORS).
  res.json({ user: toPublicUser(user), csrfToken: req.user?.csrfToken });
};
