import { Request, Response } from 'express';
import { User } from '../models/User.js';


const RANKING_FIELDS = 'username score avatarUrl';

export const getUserRanking = async (req: Request, res: Response) => {
  try {
    const topUsers = await User.find()
      .select(RANKING_FIELDS)
      .sort({ score: -1 })
      .limit(10);
    res.json(topUsers);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener ranking de usuarios' });
  }
};

/** El reverso del ranking: usuarios con peor puntaje (puede ser negativo). */
export const getUserAntiRanking = async (req: Request, res: Response) => {
  try {
    const worstUsers = await User.find()
      .select(RANKING_FIELDS)
      .sort({ score: 1 })
      .limit(10);
    res.json(worstUsers);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener el anti-ranking de usuarios' });
  }
};
