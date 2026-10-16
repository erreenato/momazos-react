import type { Request, Response } from 'express';
import { isValidObjectId } from 'mongoose';
import { Meme, type IMeme } from '../models/Meme.js';
import type { IUser } from '../models/User.js';
import type { Meme as PublicMeme } from '../types/index.js';
import { toPublicUser } from '../utils/serializers.js';

const STATUSES: IMeme['status'][] = ['pending', 'approved', 'rejected'];

const isStatus = (value: unknown): value is IMeme['status'] =>
  typeof value === 'string' && (STATUSES as string[]).includes(value);

type PopulatedMeme = Omit<IMeme, 'author'> & { author: IUser | null };

const toPublicMeme = (meme: PopulatedMeme): PublicMeme => ({
  id: String(meme._id),
  title: meme.title,
  imageUrl: meme.imageUrl,
  author: meme.author ? toPublicUser(meme.author) : 'Usuario eliminado',
  status: meme.status,
  likes: meme.likes,
  dislikes: meme.dislikes,
  score: meme.score,
  createdAt: meme.createdAt?.toISOString(),
});

// GET /api/moderation/memes (solo moderadores): memes pendientes, del más antiguo al más nuevo.
export const listPendingMemes = async (_req: Request, res: Response): Promise<void> => {
  const memes = await Meme.find({ status: 'pending' })
    .sort({ createdAt: 1 })
    .populate<{ author: IUser | null }>('author');

  res.json(memes.map(toPublicMeme));
};

// PATCH /api/memes/:id/status (solo moderadores), body: { status }
export const updateMemeStatus = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const status: unknown = req.body?.status;

  if (!isValidObjectId(id)) {
    res.status(400).json({ error: 'id de meme inválido' });
    return;
  }
  if (!isStatus(status)) {
    res.status(400).json({ error: `status debe ser uno de: ${STATUSES.join(', ')}` });
    return;
  }

  const meme = await Meme.findByIdAndUpdate(id, { status }, { returnDocument: 'after', runValidators: true })
    .populate<{ author: IUser | null }>('author');
  if (!meme) {
    res.status(404).json({ error: 'Meme no encontrado' });
    return;
  }

  res.json(toPublicMeme(meme));
};
