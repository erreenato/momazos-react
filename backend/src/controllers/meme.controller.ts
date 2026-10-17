import { Request, Response } from 'express';
import { Meme } from '../models/Meme.js';
import { User } from '../models/User.js';
import { Comment } from '../models/Comment.js';

// POST /api/memes/:id/react
export const reactToMeme = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { type } = req.body; // Expects 'like' or 'dislike'

    // 1. Validar la acción
    if (!['like', 'dislike'].includes(type)) {
      res.status(400).json({ error: 'Tipo de reacción inválido. Debe ser "like" o "dislike".' });
      return;
    }

    // 2. Buscar el meme
    const meme = await Meme.findById(id);
    if (!meme) {
      res.status(404).json({ error: 'Meme no encontrado.' });
      return;
    }

    // 3. Incrementar la reacción correspondiente
    if (type === 'like') {
      meme.likes += 1;
    } else {
      meme.dislikes += 1;
    }

    // 4. Contar los comentarios asociados al meme
    const totalComments = await Comment.countDocuments({ parentId: meme._id });

    // 5. Recalcular y guardar el score del meme
    const updatedMemeScore = await meme.updateScore(totalComments);

    // 6. Recalcular y guardar el score (karma) del autor del meme
    const author = await User.findById(meme.author);
    if (author) {
      await author.updateScore();
    }

    // 7. Retornar respuesta exitosa
    res.json({
      message: `Reacción '${type}' registrada exitosamente.`,
      meme: {
        id: meme._id,
        likes: meme.likes,
        dislikes: meme.dislikes,
        score: updatedMemeScore,
      },
    });
  } catch (error) {
    console.error('Error al reaccionar al meme:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};