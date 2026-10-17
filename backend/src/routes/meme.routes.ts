import { Router } from 'express';
import {
    getMemeRanking,
    getMemes,
    reactToMeme,
    createMeme,
} from '../controllers/meme.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { uploadMemeImage } from '../middleware/upload.js';

const router = Router();

// ⚠️ DEBE SER '/' PARA QUE SEA /api/memes
router.get('/', getMemes);

router.post('/', requireAuth, uploadMemeImage, createMeme);
// GET /api/memes/ranking (⚠️ IMPORTANTE: poner antes de /:id)
router.get('/ranking', getMemeRanking);

// Endpoint para dar Like o Dislike a un meme
router.post('/:id/react', reactToMeme);

export default router;