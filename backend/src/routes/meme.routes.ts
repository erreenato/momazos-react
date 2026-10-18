
import { Router } from 'express';
import {
    getMemeAntiRanking,
    getMemeRanking,
    getMemes,
    reactToMeme,
    createMeme,
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

// Dar like o dislike (requiere autenticación)
router.post('/:id/react', requireAuth, reactToMeme);

// Eliminar un meme propio
router.delete('/:id', requireAuth, deleteMeme);

export default router;
