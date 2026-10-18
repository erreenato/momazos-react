
import type { Request, Response } from 'express';
import { Types } from 'mongoose';
import { User } from '../models/User.js';
import { Meme } from '../models/Meme.js';
import { toPublicUser } from '../utils/serializers.js';

const RANKING_FIELDS = 'username score avatarUrl';

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

    const body: unknown = req.body;

    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
      res.status(400).json({ error: 'Datos inválidos' });
      return;
    }

    const data = body as Record<string, unknown>;
    const allowedFields = ['description', 'avatarUrl'];

    if (
      Object.keys(data).length === 0 ||
      Object.keys(data).some((key) => !allowedFields.includes(key))
    ) {
      res.status(400).json({ error: 'Campos no permitidos' });
      return;
    }

    if (
      (data.description !== undefined &&
        (typeof data.description !== 'string' || data.description.length > 500)) ||
      (data.avatarUrl !== undefined &&
        (typeof data.avatarUrl !== 'string' || data.avatarUrl.length > 2048))
    ) {
      res.status(400).json({ error: 'Datos de perfil inválidos' });
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
