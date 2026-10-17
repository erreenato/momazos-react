import { User } from '../../models/User.js';
import { Meme } from '../../models/Meme.js';
import { Comment } from '../../models/Comment.js';

export const seedApprovedMemes = async (): Promise<void> => {
  console.log('🧹 Limpiando base de datos...');
  await User.deleteMany({});
  await Meme.deleteMany({});
  await Comment.deleteMany({});

  console.log('👤 Creando usuarios base...');
  const creator = await User.create({
    username: 'meme_creator',
    email: 'creator@memes.com',
    passwordHash: '$2a$10$e8R7Zz1z...',
    role: 'user',
    score: 20, // 2 memes * 10 pts
  });

  console.log('🟢 Poblando únicamente con MEMES APROBADOS...');
  const meme1 = await Meme.create({
    title: 'Cuando compila a la primera',
    imageUrl: 'https://i.imgur.com/W33z5y4.jpg',
    author: creator._id,
    status: 'approved',
    score: 10,
    tags: ['programacion', 'react'],
  });

  const meme2 = await Meme.create({
    title: 'Viernes de deploy a producción',
    imageUrl: 'https://i.imgur.com/8Q9aXpY.jpg',
    author: creator._id,
    status: 'approved',
    score: 10,
    tags: ['backend', 'express'],
  });

  console.log('✅ Seed de Memes Aprobados completado.');
  console.log(`📌 ID Meme 1: ${meme1._id}`);
  console.log(`📌 ID Meme 2: ${meme2._id}`);
};