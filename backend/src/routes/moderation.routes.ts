import { Router } from 'express';
import { listPendingMemes, updateMemeStatus } from '../controllers/moderation.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/moderation/memes', requireAuth, requireRole('moderator'), listPendingMemes);
router.patch('/memes/:id/status', requireAuth, requireRole('moderator'), updateMemeStatus);

export default router;
