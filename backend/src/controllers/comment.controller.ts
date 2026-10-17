import { Request, Response } from 'express';
import { Comment } from '../models/Comment.js';
import { Meme } from '../models/Meme.js';
import { User } from '../models/User.js';

export const createComment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { content, parentId, parentType } = req.body;
    const userId = (req as any).user?._id;

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

    // 2. Disparar recálculo en el Meme raíz
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
    res.status(201).json(populated);
  } catch (error) {
    console.error('Error al crear comentario:', error);
    res.status(500).json({ error: 'Error al publicar comentario.' });
  }
};

// GET /api/memes/:memeId/comments
export const getMemeComments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { memeId } = req.params;
    const comments = await Comment.find({ parentId: memeId })
      .populate('author', 'username avatarUrl')
      .sort({ createdAt: -1 });

    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener comentarios.' });
  }
};