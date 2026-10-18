
import { Router } from 'express';
import {
    getUserRanking,
    getUserAntiRanking,
    getUserProfile,
    getUserMemes,
    updateMyProfile,
} from '../controllers/user.controller.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';

const router = Router();

// Ranking y anti-ranking de usuarios
router.get('/ranking', getUserRanking);
router.get('/anti-ranking', getUserAntiRanking);

// Editar mi perfil
router.patch('/me', requireAuth, updateMyProfile);

// Obtener memes de un usuario
router.get('/:id/memes', optionalAuth, getUserMemes);

// Obtener perfil de un usuario
router.get('/:id', getUserProfile);

export default router;
