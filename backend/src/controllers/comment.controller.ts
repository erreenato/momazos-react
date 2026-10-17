import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { Comment, CommentDocument } from '../models/Comment.js';
import { Meme } from '../models/Meme.js';
import { User } from '../models/User.js';

type ReactionType = 'like' | 'dislike';

/** Añade `myReaction` (el voto de quien consulta) sin exponer los votantes. */
const serializeComment = (comment: CommentDocument, viewerId?: string) => {
  const plain = comment.toObject() as Record<string, unknown>;
  const likedBy = ((plain.likedBy as unknown[]) ?? []).map(String);
  const dislikedBy = ((plain.dislikedBy as unknown[]) ?? []).map(String);

  let myReaction: ReactionType | null = null;
  if (viewerId) {
    if (likedBy.includes(viewerId)) myReaction = 'like';
    else if (dislikedBy.includes(viewerId)) myReaction = 'dislike';
  }

  delete plain.likedBy;
  delete plain.dislikedBy;

  return { ...plain, myReaction };
};

export const createComment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { content, parentId, parentType } = req.body;
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'No autenticado' });
      return;
    }

    let targetMemeId = parentId;

    // Si le responde a otro comentario, traemos el memeId de ese comentario padre
    if (parentType === 'Comment') {
      const parentComment = await Comment.findById(parentId);
      if (!parentComment) {
        res.status(404).json({ error: 'El comentario al que intentas responder no existe.' });
        return;
      }
      targetMemeId = parentComment.memeId;
    }

    // 1. Guardar el nuevo comentario con su memeId asignado
    const newComment = new Comment({
      content,
      author: userId,
      parentId,
      parentType,
      memeId: targetMemeId,
    });
    await newComment.save();
    await newComment.updateScore();

    // 2. Disparar recálculo en el Meme raíz (crear un comentario sí incrementa interacción del meme)
    const meme = await Meme.findById(targetMemeId);
    if (meme && typeof meme.updateScore === 'function') {
      await meme.updateScore();
    }

    // 3. Actualizar puntaje del usuario que comentó
    const commenter = await User.findById(userId);
    if (commenter && typeof commenter.updateScore === 'function') {
      await commenter.updateScore();
    }

    const populated = await Comment.findById(newComment._id).populate('author', 'username avatarUrl');
    res.status(201).json(serializeComment(populated as CommentDocument, userId));
  } catch (error) {
    console.error('Error al crear comentario:', error);
    res.status(500).json({ error: 'Error al publicar comentario.' });
  }
};

// GET /api/comments/meme/:memeId
export const getMemeComments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { memeId } = req.params;
    const comments = (await Comment.find({ memeId })
      .populate('author', 'username avatarUrl')
      .sort({ createdAt: -1 })) as CommentDocument[];

    res.json(comments.map((comment) => serializeComment(comment, req.user?.id)));
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener comentarios.' });
  }
};

// POST /api/comments/:id/react
export const reactToComment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { type } = req.body as { type?: ReactionType }; // 'like' | 'dislike'
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Debes iniciar sesión para reaccionar.' });
      return;
    }
    if (type !== 'like' && type !== 'dislike') {
      res.status(400).json({ error: 'Tipo de reacción inválido. Debe ser "like" o "dislike".' });
      return;
    }

    const comment = (await Comment.findById(id)) as CommentDocument | null;
    if (!comment) {
      res.status(404).json({ error: 'Comentario no encontrado.' });
      return;
    }

    // Un voto por usuario: si ya votó lo mismo no cambia; si votó lo contrario, se cambia.
    const alreadyLiked = comment.likedBy.some((voter) => String(voter) === userId);
    const alreadyDisliked = comment.dislikedBy.some((voter) => String(voter) === userId);

    if (type === 'like') {
      if (!alreadyLiked) {
        comment.likedBy.push(new Types.ObjectId(userId));
        comment.dislikedBy = comment.dislikedBy.filter((voter) => String(voter) !== userId);
      }
    } else if (!alreadyDisliked) {
      comment.dislikedBy.push(new Types.ObjectId(userId));
      comment.likedBy = comment.likedBy.filter((voter) => String(voter) !== userId);
    }

    comment.likes = comment.likedBy.length;
    comment.dislikes = comment.dislikedBy.length;

    // Actualizar el score del propio comentario
    await comment.updateScore();

    // Cascada: Actualizar ÚNICAMENTE al autor del comentario
    const commentAuthor = await User.findById(comment.author);
    if (commentAuthor && typeof commentAuthor.updateScore === 'function') {
      await commentAuthor.updateScore();
    }

    res.json({ message: 'Reacción a comentario procesada', comment: serializeComment(comment, userId) });
  } catch (error) {
    console.error('Error al reaccionar al comentario:', error);
    res.status(500).json({ error: 'Error al procesar la reacción.' });
  }
};
