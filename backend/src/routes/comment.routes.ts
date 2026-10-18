import { Router } from 'express';
import {
  createComment,
  deleteComment,
  getCommentById,
  getComments,
  getMemeComments,
  reactToComment,
  updateComment,
} from '../controllers/comment.controller.js';
import { optionalAuth, requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/', requireAuth, createComment);
router.get('/', optionalAuth, getComments);
router.get('/meme/:memeId', optionalAuth, getMemeComments);
router.get('/:id', optionalAuth, getCommentById);
router.patch('/:id', requireAuth, updateComment);
router.delete('/:id', requireAuth, deleteComment);
router.post('/:id/react', requireAuth, reactToComment); // requires sesión para reaccionar

export default router;
