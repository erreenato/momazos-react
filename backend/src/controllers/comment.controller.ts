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

const canManageComment = (comment: CommentDocument, req: Request): boolean =>
  req.user?.role === 'moderator' || String(comment.author) === req.user?.id;

const canViewComment = async (comment: CommentDocument, req: Request): Promise<boolean> => {
  const meme = await Meme.findById(comment.memeId).select('status author');
  if (!meme) return false;
  return (
    meme.status === 'approved' ||
    req.user?.role === 'moderator' ||
    String(meme.author) === req.user?.id ||
    String(comment.author) === req.user?.id
  );
};

const populateComment = async (
  comment: CommentDocument,
  viewerId?: string,
): Promise<ReturnType<typeof serializeComment>> => {
  const populated = await comment.populate('author', 'username avatarUrl');
  return serializeComment(populated as CommentDocument, viewerId);
};

// GET /api/comments
export const getComments = async (req: Request, res: Response): Promise<void> => {
  try {
    const approvedMemes = await Meme.find({ status: 'approved' }).select('_id');
    const comments = (await Comment.find({ memeId: { $in: approvedMemes.map((meme) => meme._id) } })
      .populate('author', 'username avatarUrl')
      .sort({ createdAt: -1 })) as CommentDocument[];

    res.json(comments.map((comment) => serializeComment(comment, req.user?.id)));
  } catch (error) {
    console.error('Error al listar comentarios:', error);
    res.status(500).json({ error: 'Error al listar comentarios.' });
  }
};

// GET /api/comments/:id
export const getCommentById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (typeof id !== 'string' || !Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'ID de comentario inválido.' });
      return;
    }

    const comment = (await Comment.findById(id)) as CommentDocument | null;
    if (!comment || !(await canViewComment(comment, req))) {
      res.status(404).json({ error: 'Comentario no encontrado.' });
      return;
    }

    res.json(await populateComment(comment, req.user?.id));
  } catch (error) {
    console.error('Error al obtener comentario:', error);
    res.status(500).json({ error: 'Error al obtener el comentario.' });
  }
};

export const createComment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { content, parentId, parentType } = req.body;
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'No autenticado' });
      return;
    }

    if (
      typeof content !== 'string' ||
      !content.trim() ||
      content.trim().length > 2000 ||
      typeof parentId !== 'string' ||
      !Types.ObjectId.isValid(parentId) ||
      (parentType !== 'Meme' && parentType !== 'Comment')
    ) {
      res.status(400).json({ error: 'Contenido, parentId o parentType inválidos.' });
      return;
    }

    let targetMemeId: string | Types.ObjectId = parentId;

    // Si le responde a otro comentario, traemos el memeId de ese comentario padre
    if (parentType === 'Comment') {
      const parentComment = await Comment.findById(parentId);
      if (!parentComment) {
        res.status(404).json({ error: 'El comentario al que intentas responder no existe.' });
        return;
      }
      targetMemeId = parentComment.memeId;
    }

    const targetMeme = await Meme.findById(targetMemeId);
    if (!targetMeme) {
      res.status(404).json({ error: 'El meme al que intentas comentar no existe.' });
      return;
    }

    // 1. Guardar el nuevo comentario con su memeId asignado
    const newComment = new Comment({
      content: content.trim(),
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
    if (typeof memeId !== 'string' || !Types.ObjectId.isValid(memeId)) {
      res.status(400).json({ error: 'ID de meme inválido.' });
      return;
    }

    const comments = (await Comment.find({ memeId })
      .populate('author', 'username avatarUrl')
      .sort({ createdAt: -1 })) as CommentDocument[];

    res.json(comments.map((comment) => serializeComment(comment, req.user?.id)));
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener comentarios.' });
  }
};

// PATCH /api/comments/:id
export const updateComment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (typeof id !== 'string' || !Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'ID de comentario inválido.' });
      return;
    }

    const body: unknown = req.body;
    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
      res.status(400).json({ error: 'Datos de comentario inválidos.' });
      return;
    }

    const data = body as Record<string, unknown>;
    if (
      Object.keys(data).length !== 1 ||
      typeof data.content !== 'string' ||
      !data.content.trim() ||
      data.content.trim().length > 2000
    ) {
      res.status(400).json({ error: 'Solo se puede actualizar content y debe ser válido.' });
      return;
    }

    const comment = (await Comment.findById(id)) as CommentDocument | null;
    if (!comment) {
      res.status(404).json({ error: 'Comentario no encontrado.' });
      return;
    }
    if (!canManageComment(comment, req)) {
      res.status(403).json({ error: 'No tienes permisos para modificar este comentario.' });
      return;
    }

    comment.content = data.content.trim();
    await comment.save();
    res.json(await populateComment(comment, req.user?.id));
  } catch (error) {
    console.error('Error al actualizar comentario:', error);
    res.status(500).json({ error: 'Error al actualizar el comentario.' });
  }
};

// DELETE /api/comments/:id
export const deleteComment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (typeof id !== 'string' || !Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'ID de comentario inválido.' });
      return;
    }

    const comment = (await Comment.findById(id)) as CommentDocument | null;
    if (!comment) {
      res.status(404).json({ error: 'Comentario no encontrado.' });
      return;
    }
    if (!canManageComment(comment, req)) {
      res.status(403).json({ error: 'No tienes permisos para eliminar este comentario.' });
      return;
    }

    const descendants: Array<{ _id: Types.ObjectId; author: Types.ObjectId }> = [];
    let parentIds = [comment._id];
    while (parentIds.length > 0) {
      const children = await Comment.find({ parentId: { $in: parentIds } }).select('_id author');
      descendants.push(...children);
      parentIds = children.map((child) => child._id);
    }

    const deletedCommentIds = [comment._id, ...descendants.map((child) => child._id)];
    const affectedAuthors = [comment.author, ...descendants.map((child) => child.author)];
    await Comment.deleteMany({ _id: { $in: deletedCommentIds } });

    const meme = await Meme.findById(comment.memeId);
    if (meme) await meme.updateScore();
    for (const authorId of affectedAuthors) {
      const author = await User.findById(authorId);
      if (author) await author.updateScore();
    }

    res.status(204).end();
  } catch (error) {
    console.error('Error al eliminar comentario:', error);
    res.status(500).json({ error: 'Error al eliminar el comentario.' });
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
    if (typeof id !== 'string' || !Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'ID de comentario inválido.' });
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
