import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { Meme, type IMeme } from '../models/Meme.js';

type ReactionType = 'like' | 'dislike';

type MemeWithAuthor = Omit<IMeme, 'author'> & {
  author: Types.ObjectId | { _id: Types.ObjectId; username: string };
};

/**
 * Convierte un meme (posiblemente poblado con su autor) en la respuesta pública:
 * oculta quién votó y expone `myReaction` para que el frontend sepa si este
 * usuario ya votó y no muestre el botón como si no lo hubiera hecho.
 */
const serializeMeme = (meme: MemeWithAuthor, viewerId?: string) => {
  const likedBy = (meme.likedBy ?? []).map((id) => String(id));
  const dislikedBy = (meme.dislikedBy ?? []).map((id) => String(id));

  let myReaction: ReactionType | null = null;
  if (viewerId) {
    if (likedBy.includes(viewerId)) myReaction = 'like';
    else if (dislikedBy.includes(viewerId)) myReaction = 'dislike';
  }

  const author = !meme.author
    ? 'Usuario eliminado'
    : typeof meme.author === 'object' && 'username' in meme.author
      ? { _id: String((meme.author as { _id: Types.ObjectId })._id), username: meme.author.username }
      : meme.author;

  return {
    _id: String(meme._id),
    title: meme.title,
    imageUrl: meme.imageUrl,
    author,
    status: meme.status,
    likes: meme.likes,
    dislikes: meme.dislikes,
    score: meme.score,
    tags: meme.tags,
    createdAt: meme.createdAt,
    myReaction,
  };
};

// GET /api/memes
export const getMemes = async (req: Request, res: Response): Promise<void> => {
  try {
    // Buscamos solo los memes aprobados y traemos el username de su autor
    const memes = await Meme.find({ status: 'approved' })
      .populate('author', 'username')
      .sort({ createdAt: -1 }); // Ordenados del más reciente al más antiguo

    res.json(memes.map((meme) => serializeMeme(meme as unknown as MemeWithAuthor, req.user?.id)));
  } catch (error) {
    console.error('Error al obtener memes:', error);
    res.status(500).json({ error: 'Error al obtener los memes de la base de datos.' });
  }
};

const findViewerReaction = (meme: IMeme, viewerId: string): ReactionType | null => {
  if (meme.likedBy.some((id) => String(id) === viewerId)) return 'like';
  if (meme.dislikedBy.some((id) => String(id) === viewerId)) return 'dislike';
  return null;
};

// POST /api/memes/:id/react
export const reactToMeme = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { type } = req.body as { type?: ReactionType };
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Debes iniciar sesión para reaccionar.' });
      return;
    }

    // 1. Validar la acción
    if (type !== 'like' && type !== 'dislike') {
      res.status(400).json({ error: 'Tipo de reacción inválido. Debe ser "like" o "dislike".' });
      return;
    }

    // 2. Buscar el meme
    const meme = await Meme.findById(id);
    if (!meme) {
      res.status(404).json({ error: 'Meme no encontrado.' });
      return;
    }

    // 3. Un voto por usuario: los arrays son la fuente de verdad.
    //    - Si ya votó lo mismo, no pasa nada (evita likes infinitos).
    //    - Si votó lo contrario, se cambia el voto.
    const alreadyLiked = meme.likedBy.some((voter) => String(voter) === userId);
    const alreadyDisliked = meme.dislikedBy.some((voter) => String(voter) === userId);

    if (type === 'like') {
      if (!alreadyLiked) {
        meme.likedBy.push(new Types.ObjectId(userId));
        meme.dislikedBy = meme.dislikedBy.filter((voter) => String(voter) !== userId);
      }
    } else if (!alreadyDisliked) {
      meme.dislikedBy.push(new Types.ObjectId(userId));
      meme.likedBy = meme.likedBy.filter((voter) => String(voter) !== userId);
    }

    // 4. Mantener los contadores sincronizados con los votantes únicos
    meme.likes = meme.likedBy.length;
    meme.dislikes = meme.dislikedBy.length;

    // 5. Recalcular y guardar el score del meme y de su autor
    const updatedMemeScore = await meme.updateScore();

    const message =
      findViewerReaction(meme, userId) === type
        ? `Reacción '${type}' registrada exitosamente.`
        : `Reacción '${type}' quitada.`;

    res.json({
      message,
      meme: {
        id: meme._id,
        likes: meme.likes,
        dislikes: meme.dislikes,
        score: updatedMemeScore,
        myReaction: findViewerReaction(meme, userId),
      },
    });
  } catch (error) {
    console.error('Error al reaccionar al meme:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

// GET /api/memes/ranking
export const getMemeRanking = async (req: Request, res: Response): Promise<void> => {
  try {
    const topMemes = await Meme.find({ status: 'approved' })
      .populate('author', 'username')
      .sort({ score: -1 })
      .limit(10);
    res.json(topMemes.map((meme) => serializeMeme(meme as unknown as MemeWithAuthor, req.user?.id)));
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener ranking de memes' });
  }
};

// GET /api/memes/anti-ranking
export const getMemeAntiRanking = async (req: Request, res: Response): Promise<void> => {
  try {
    // El orden inverso al ranking: primero los peores puntajes (pueden ser negativos).
    const worstMemes = await Meme.find({ status: 'approved' })
      .populate('author', 'username')
      .sort({ score: 1, likes: 1 })
      .limit(10);
    res.json(worstMemes.map((meme) => serializeMeme(meme as unknown as MemeWithAuthor, req.user?.id)));
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener el anti-ranking de memes' });
  }
};
