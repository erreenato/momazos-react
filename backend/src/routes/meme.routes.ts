import { Router } from 'express';
import { reactToMeme } from '../controllers/meme.controller.js';

const router = Router();

// Endpoint para dar Like o Dislike a un meme
router.post('/:id/react', reactToMeme);

export default router;