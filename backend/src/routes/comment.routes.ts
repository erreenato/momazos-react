import { Router } from 'express';
import { createComment, getMemeComments, reactToComment } from '../controllers/comment.controller.js';
import { optionalAuth, requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/', requireAuth, createComment);
router.get('/meme/:memeId', optionalAuth, getMemeComments);
router.post('/:id/react', requireAuth, reactToComment); // requires sesión para reaccionar

export default router;
