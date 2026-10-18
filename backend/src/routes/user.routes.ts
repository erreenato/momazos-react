import { Router } from 'express';
import { getUserAntiRanking, getUserRanking } from '../controllers/user.controller.js';

const router = Router();

router.get('/ranking', getUserRanking);
router.get('/anti-ranking', getUserAntiRanking);

export default router;
