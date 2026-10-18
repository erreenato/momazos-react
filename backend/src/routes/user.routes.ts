
import { Router } from 'express';
import {
    getUserRanking,
    getUserAntiRanking,
    listUsers,
    getUserProfile,
    getUserMemes,
    updateMyProfile,
    updateUser,
    deleteUser,
} from '../controllers/user.controller.js';
import { register } from '../controllers/auth.controller.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';

const router = Router();

// Crear usuario: usa la misma validación y creación de sesión que el registro.
router.post('/', register);

// Ranking y anti-ranking de usuarios
router.get('/ranking', getUserRanking);
router.get('/anti-ranking', getUserAntiRanking);

// Editar mi perfil
router.patch('/me', requireAuth, updateMyProfile);

// Listar usuarios públicos
router.get('/', listUsers);

// Obtener memes de un usuario
router.get('/:id/memes', optionalAuth, getUserMemes);

// Obtener perfil de un usuario
router.get('/:id', getUserProfile);

// Actualizar o eliminar un usuario: solo el propio usuario o un moderador.
router.patch('/:id', requireAuth, updateUser);
router.delete('/:id', requireAuth, deleteUser);

export default router;
