
import { Router } from 'express';
import {
    getMemeAntiRanking,
    getMemeRanking,
    getMemes,
    reactToMeme,
    createMeme,
    getMemeById,
    updateMeme,
    deleteMeme,
} from '../controllers/meme.controller.js';
import { optionalAuth, requireAuth } from '../middleware/auth.js';
import { uploadMemeImage } from '../middleware/upload.js';

const router = Router();

// Listar memes
router.get('/', optionalAuth, getMemes);

// Publicar un meme con imagen
router.post('/', requireAuth, uploadMemeImage, createMeme);

// Ranking de memes
router.get('/ranking', optionalAuth, getMemeRanking);

// Anti-ranking de memes
router.get('/anti-ranking', optionalAuth, getMemeAntiRanking);

// Obtener un meme por id
router.get('/:id', optionalAuth, getMemeById);

// Editar o eliminar un meme: solo su autor o un moderador
router.patch('/:id', requireAuth, updateMeme);
router.delete('/:id', requireAuth, deleteMeme);

// Dar like o dislike (requiere autenticación)
router.post('/:id/react', requireAuth, reactToMeme);

export default router;
