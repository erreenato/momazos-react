import { Request, Response } from 'express';
import { Meme } from '../models/Meme.js';

// GET /api/memes
export const getMemes = async (req: Request, res: Response): Promise<void> => {
  try {
    // Buscamos solo los memes aprobados y traemos el username de su autor
    const memes = await Meme.find({ status: 'approved' })
      .populate('author', 'username')
      .sort({ createdAt: -1 }); // Ordenados del más reciente al más antiguo

    res.json(memes);
  } catch (error) {
    console.error('Error al obtener memes:', error);
    res.status(500).json({ error: 'Error al obtener los memes de la base de datos.' });
  }
};

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

    // 4. Recalcular y guardar el score del meme y de su autor
    const updatedMemeScore = await meme.updateScore();

    // 5. Retornar respuesta exitosa
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

export const getMemeRanking = async (req: Request, res: Response) => {
  try {
    const topMemes = await Meme.find({ status: 'approved' })
      .populate('author', 'username')
      .sort({ score: -1 })
      .limit(10);
    res.json(topMemes);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener ranking de memes' });
  }
};


/**
 * POST /api/memes
 * Publica un meme asociado al usuario autenticado.
 * Los memes nuevos quedan pendientes de moderación.
 */
export const createMeme = async (
  req: Request,
  res: Response,
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
