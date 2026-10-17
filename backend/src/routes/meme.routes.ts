import { Router } from 'express';
import { getMemeRanking, getMemes, reactToMeme } from '../controllers/meme.controller.js';

const router = Router();

// ⚠️ DEBE SER '/' PARA QUE SEA /api/memes
router.get('/', getMemes);

// GET /api/memes/ranking (⚠️ IMPORTANTE: poner antes de /:id)
router.get('/ranking', getMemeRanking);

// Endpoint para dar Like o Dislike a un meme
router.post('/:id/react', reactToMeme);

export default router;