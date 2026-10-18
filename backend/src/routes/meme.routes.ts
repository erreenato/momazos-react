import { Router } from 'express';
import {
  getMemeAntiRanking,
  getMemeRanking,
  getMemes,
  reactToMeme,
} from '../controllers/meme.controller.js';
import { optionalAuth, requireAuth } from '../middleware/auth.js';

const router = Router();

// ⚠️ DEBE SER '/' PARA QUE SEA /api/memes
router.get('/', optionalAuth, getMemes);

// GET /api/memes/ranking (⚠️ IMPORTANTE: poner antes de /:id)
router.get('/ranking', optionalAuth, getMemeRanking);

// GET /api/memes/anti-ranking (también antes de /:id)
router.get('/anti-ranking', optionalAuth, getMemeAntiRanking);

// Endpoint para dar Like o Dislike a un meme (solo usuarios registrados)
router.post('/:id/react', requireAuth, reactToMeme);

export default router;
