import { Router } from 'express';
import { getUserRanking } from '../controllers/user.controller.js';

const router = Router();

router.get('/ranking', getUserRanking);

export default router;