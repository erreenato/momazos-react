import { Router } from 'express';
import { createComment, getMemeComments, reactToComment } from '../controllers/comment.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/', requireAuth, createComment);
router.get('/meme/:memeId', getMemeComments);
router.post('/:id/react', reactToComment); // 👈 Nueva ruta para likes/dislikes

export default router;