import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { Meme, type IMeme } from '../models/Meme.js';
import { Comment } from '../models/Comment.js';
import { User } from '../models/User.js';

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

const isMemeOwnerOrModerator = (meme: IMeme, req: Request): boolean =>
  req.user?.role === 'moderator' || String(meme.author) === req.user?.id;

const isValidImageUrl = (value: unknown): value is string =>
  typeof value === 'string' && /^https?:\/\/\S+$/i.test(value.trim()) && value.trim().length <= 2048;

const serializeSingleMeme = async (meme: IMeme, viewerId?: string) => {
  const populated = await meme.populate('author', 'username');
  return serializeMeme(populated as unknown as MemeWithAuthor, viewerId);
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

// GET /api/memes/:id
export const getMemeById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (typeof id !== 'string' || !Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'ID de meme inválido.' });
      return;
    }

    const meme = await Meme.findById(id);
    if (!meme) {
      res.status(404).json({ error: 'Meme no encontrado.' });
      return;
    }

    const canSeeUnapproved = isMemeOwnerOrModerator(meme, req);
    if (meme.status !== 'approved' && !canSeeUnapproved) {
      res.status(404).json({ error: 'Meme no encontrado.' });
      return;
    }

    res.json(await serializeSingleMeme(meme, req.user?.id));
  } catch (error) {
    console.error('Error al obtener meme:', error);
    res.status(500).json({ error: 'Error al obtener el meme.' });
  }
};

// PATCH /api/memes/:id
export const updateMeme = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (typeof id !== 'string' || !Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'ID de meme inválido.' });
      return;
    }

    const body: unknown = req.body;
    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
      res.status(400).json({ error: 'Datos de meme inválidos.' });
      return;
    }

    const data = body as Record<string, unknown>;
    const allowedFields = ['title', 'imageUrl', 'tags'];
    if (
      Object.keys(data).length === 0 ||
      Object.keys(data).some((key) => !allowedFields.includes(key))
    ) {
      res.status(400).json({ error: 'Solo se pueden actualizar title, imageUrl y tags.' });
      return;
    }

    const meme = await Meme.findById(id);
    if (!meme) {
      res.status(404).json({ error: 'Meme no encontrado.' });
      return;
    }
    if (!isMemeOwnerOrModerator(meme, req)) {
      res.status(403).json({ error: 'No tienes permisos para modificar este meme.' });
      return;
    }

    if (
      data.title !== undefined &&
      (typeof data.title !== 'string' || !data.title.trim() || data.title.trim().length > 200)
    ) {
      res.status(400).json({ error: 'El título no es válido.' });
      return;
    }
    if (data.imageUrl !== undefined && !isValidImageUrl(data.imageUrl)) {
      res.status(400).json({ error: 'La URL de imagen no es válida.' });
      return;
    }
    if (
      data.tags !== undefined &&
      (!Array.isArray(data.tags) ||
        data.tags.some((tag) => typeof tag !== 'string' || tag.trim().length > 50))
    ) {
      res.status(400).json({ error: 'Las etiquetas no son válidas.' });
      return;
    }

    if (typeof data.title === 'string') meme.title = data.title.trim();
    if (typeof data.imageUrl === 'string') meme.imageUrl = data.imageUrl.trim();
    if (Array.isArray(data.tags)) meme.tags = data.tags.map((tag) => tag.trim()).filter(Boolean);

    await meme.save();
    res.json(await serializeSingleMeme(meme, req.user?.id));
  } catch (error) {
    console.error('Error al actualizar meme:', error);
    res.status(500).json({ error: 'Error al actualizar el meme.' });
  }
};

// DELETE /api/memes/:id
export const deleteMeme = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (typeof id !== 'string' || !Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'ID de meme inválido.' });
      return;
    }

    const meme = await Meme.findById(id);
    if (!meme) {
      res.status(404).json({ error: 'Meme no encontrado.' });
      return;
    }
    if (!isMemeOwnerOrModerator(meme, req)) {
      res.status(403).json({ error: 'No tienes permisos para eliminar este meme.' });
      return;
    }

    await Comment.deleteMany({ memeId: meme._id });
    await Meme.deleteOne({ _id: meme._id });

    const author = await User.findById(meme.author);
    if (author) await author.updateScore();

    res.status(204).end();
  } catch (error) {
    console.error('Error al eliminar meme:', error);
    res.status(500).json({ error: 'Error al eliminar el meme.' });
  }
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
    if (typeof id !== 'string' || !Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'ID de meme inválido.' });
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


/**
 * GET /api/memes/anti-ranking
 * Obtiene los 10 memes aprobados con peor puntaje.
 */
export const getMemeAntiRanking = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const worstMemes = await Meme.find({ status: 'approved' })
      .populate('author', 'username')
      .sort({ score: 1, likes: 1 })
      .limit(10);

    res.json(
      worstMemes.map((meme) =>
        serializeMeme(meme as unknown as MemeWithAuthor, req.user?.id)
      )
    );
  } catch (error) {
    console.error('Error al obtener anti-ranking de memes:', error);
    res.status(500).json({
      error: 'Error al obtener el anti-ranking de memes',
    });
  }
};

/**
 * POST /api/memes
 * Publica un meme asociado al usuario autenticado.
 * Los memes nuevos quedan pendientes de moderación.
 */
export const createMeme = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'No autenticado' });
      return;
    }

    const { title, imageUrl } = req.body ?? {};

    const finalImageUrl = req.file
      ? `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`
      : imageUrl;

    if (
      typeof title !== 'string' ||
      !title.trim() ||
      title.trim().length > 200 ||
      typeof finalImageUrl !== 'string' ||
      !/^https?:\/\/\S+$/i.test(finalImageUrl.trim()) ||
      finalImageUrl.trim().length > 2048
    ) {
      res.status(400).json({
        error: 'Debes ingresar un título y una URL de imagen válidos.',
      });
      return;
    }

    const meme = await Meme.create({
      title: title.trim(),
      imageUrl: finalImageUrl.trim(),
      author: req.user.id,
      status: 'pending',
    });

    res.status(201).json(meme);
  } catch (error) {
    console.error('Error al publicar meme:', error);
    res.status(500).json({
      error: 'No se pudo publicar el meme.',
    });
  }
};
