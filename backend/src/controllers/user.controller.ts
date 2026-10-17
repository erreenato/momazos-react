import { Request, Response } from 'express';
import { User } from '../models/User.js';


export const getUserRanking = async (req: Request, res: Response) => {
  try {
    const topUsers = await User.find()
      .select('username score avatarUrl')
      .sort({ score: -1 })
      .limit(10);
    res.json(topUsers);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener ranking de usuarios' });
  }
};