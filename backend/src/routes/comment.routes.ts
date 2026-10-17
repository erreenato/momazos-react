import { Router } from 'express';
import { createComment, getMemeComments } from '../controllers/comment.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/', requireAuth, createComment);
router.get('/meme/:memeId', getMemeComments);

export default router;