import type { IUser } from '../models/User.js';
import type { User as PublicUser } from '../types/index.js';

/** Datos públicos del usuario: nunca incluye email ni passwordHash. */
export const toPublicUser = (user: IUser): PublicUser => ({
  id: String(user._id),
  username: user.username,
  role: user.role,
  description: user.description,
  score: user.score,
  avatarUrl: user.avatarUrl,
});
