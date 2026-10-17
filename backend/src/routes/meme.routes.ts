import { Router } from 'express';
import { getMemes, reactToMeme } from '../controllers/meme.controller.js';

const router = Router();

// ⚠️ DEBE SER '/' PARA QUE SEA /api/memes
router.get('/', getMemes);

// Endpoint para dar Like o Dislike a un meme
router.post('/:id/react', reactToMeme);

export default router;