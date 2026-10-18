
import type { Request, Response } from 'express';
import mongoose, { Types } from 'mongoose';
import { User } from '../models/User.js';
import { Meme } from '../models/Meme.js';
import { Comment } from '../models/Comment.js';
import { toPublicUser } from '../utils/serializers.js';

const RANKING_FIELDS = 'username score avatarUrl';
const PUBLIC_USER_FIELDS = 'username role description score avatarUrl';

const isOwnerOrModerator = (userId: string, req: Request): boolean =>
  req.user?.role === 'moderator' || req.user?.id === userId;

const isDuplicateKeyError = (error: unknown): boolean =>
  error instanceof Error && 'code' in error && error.code === 11000;

const sendUserPersistenceError = (error: unknown, res: Response, action: string): void => {
  if (error instanceof mongoose.Error.ValidationError) {
    res.status(400).json({ error: 'Los datos del usuario no son válidos' });
    return;
  }
  if (isDuplicateKeyError(error)) {
    res.status(409).json({ error: 'El nombre de usuario o email ya está registrado' });
    return;
  }
  console.error(`Error al ${action}:`, error);
  res.status(500).json({ error: `Error al ${action}` });
};

const readProfileData = (
  body: unknown,
): { valid: true; data: Record<string, unknown> } | { valid: false; message: string } => {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return { valid: false, message: 'Datos inválidos' };
  }

  const data = body as Record<string, unknown>;
  const allowedFields = ['username', 'email', 'description', 'avatarUrl'];
  if (
    Object.keys(data).length === 0 ||
    Object.keys(data).some((key) => !allowedFields.includes(key))
  ) {
    return { valid: false, message: 'Campos no permitidos' };
  }

  if (
    (data.username !== undefined &&
      (typeof data.username !== 'string' || !data.username.trim() || data.username.trim().length > 50)) ||
    (data.email !== undefined &&
      (typeof data.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim()))) ||
    (data.description !== undefined &&
      (typeof data.description !== 'string' || data.description.length > 500)) ||
    (data.avatarUrl !== undefined &&
      (typeof data.avatarUrl !== 'string' || data.avatarUrl.length > 2048))
  ) {
    return { valid: false, message: 'Datos de perfil inválidos' };
  }

  return { valid: true, data };
};

// GET /api/users
export const listUsers = async (_req: Request, res: Response): Promise<void> => {
  try {
    const users = await User.find()
      .select(PUBLIC_USER_FIELDS)
      .sort({ username: 1 });

    res.json(users.map(toPublicUser));
  } catch (error) {
    console.error('Error al listar usuarios:', error);
    res.status(500).json({ error: 'Error al listar usuarios' });
  }
};

// GET /api/users/ranking
export const getUserRanking = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const topUsers = await User.find()
      .select(RANKING_FIELDS)
      .sort({ score: -1 })
      .limit(10);

    res.json(topUsers);
  } catch (error) {
    console.error('Error al obtener ranking:', error);
    res.status(500).json({ error: 'Error al obtener ranking de usuarios' });
  }
};

// GET /api/users/anti-ranking
export const getUserAntiRanking = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const worstUsers = await User.find()
      .select(RANKING_FIELDS)
      .sort({ score: 1 })
      .limit(10);

    res.json(worstUsers);
  } catch (error) {
    console.error('Error al obtener anti-ranking:', error);
    res.status(500).json({ error: 'Error al obtener el anti-ranking de usuarios' });
  }
};

// GET /api/users/:id
export const getUserProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (typeof id !== 'string' || !Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'ID de usuario inválido' });
      return;
    }

    const user = await User.findById(id);

    if (!user) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    res.json(toPublicUser(user));
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({ error: 'Error al obtener perfil' });
  }
};

// GET /api/users/:id/memes
export const getUserMemes = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (typeof id !== 'string' || !Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'ID de usuario inválido' });
      return;
    }

    const user = await User.findById(id);

    if (!user) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    const canSeeAll =
      req.user?.id === String(user._id) ||
      req.user?.role === 'moderator';

    const memes = await Meme.find({
      author: user._id,
      ...(canSeeAll ? {} : { status: 'approved' }),
    })
      .populate('author', 'username avatarUrl')
      .sort({ createdAt: -1 });

    res.json(memes);
  } catch (error) {
    console.error('Error al obtener memes del usuario:', error);
    res.status(500).json({ error: 'Error al obtener memes del usuario' });
  }
};

// PATCH /api/users/me
export const updateMyProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'No autenticado' });
      return;
    }

    const body =
      typeof req.body === 'object' && req.body !== null && !Array.isArray(req.body)
        ? req.body
        : {};
    const data = body as Record<string, unknown>;
    if (Object.keys(data).some((key) => key !== 'description' && key !== 'avatarUrl') || Object.keys(data).length === 0) {
      res.status(400).json({ error: 'Solo puedes actualizar description y avatarUrl.' });
      return;
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    if (typeof data.description === 'string') {
      user.description = data.description.trim();
    }

    if (typeof data.avatarUrl === 'string') {
      user.avatarUrl = data.avatarUrl.trim();
    }

    await user.save();

    res.json(toPublicUser(user));
  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    res.status(500).json({ error: 'Error al actualizar perfil' });
  }
};

// PATCH /api/users/:id
export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (typeof id !== 'string' || !Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'ID de usuario inválido' });
      return;
    }
    if (!isOwnerOrModerator(id, req)) {
      res.status(403).json({ error: 'No tienes permisos para modificar este usuario' });
      return;
    }

    const parsed = readProfileData(req.body);
    if (!parsed.valid) {
      res.status(400).json({ error: parsed.message });
      return;
    }

    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    const { data } = parsed;
    if (typeof data.username === 'string') user.username = data.username.trim();
    if (typeof data.email === 'string') user.email = data.email.trim().toLowerCase();
    if (typeof data.description === 'string') user.description = data.description.trim();
    if (typeof data.avatarUrl === 'string') user.avatarUrl = data.avatarUrl.trim();

    await user.save();
    res.json(toPublicUser(user));
  } catch (error) {
    sendUserPersistenceError(error, res, 'actualizar usuario');
  }
};

// DELETE /api/users/:id
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (typeof id !== 'string' || !Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'ID de usuario inválido' });
      return;
    }
    if (!isOwnerOrModerator(id, req)) {
      res.status(403).json({ error: 'No tienes permisos para eliminar este usuario' });
      return;
    }

    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    const memes = await Meme.find({ author: user._id }).select('_id');
    const memeIds = memes.map((meme) => meme._id);
    await Comment.deleteMany({ $or: [{ author: user._id }, { memeId: { $in: memeIds } }] });
    await Meme.deleteMany({ author: user._id });
    await User.deleteOne({ _id: user._id });

    res.status(204).end();
  } catch (error) {
    sendUserPersistenceError(error, res, 'eliminar usuario');
  }
};
