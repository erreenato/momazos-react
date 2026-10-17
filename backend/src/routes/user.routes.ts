
import { Router } from 'express';
import {
    getUserRanking,
    getUserProfile,
    getUserMemes,
    updateMyProfile,
} from '../controllers/user.controller.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';

const router = Router();

router.get('/ranking', getUserRanking);

router.patch('/me', requireAuth, updateMyProfile);

router.get('/:id/memes', optionalAuth, getUserMemes);
router.get('/:id', getUserProfile);

export default router;
