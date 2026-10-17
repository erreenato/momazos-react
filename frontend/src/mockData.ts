import type { User, Meme, Comment } from './types';

// ==========================================
// USUARIOS (2)
// ==========================================
export const mockUsers: User[] = [
  {
    id: 'user_1',
    username: 'MemeLord99',
    role: 'user',
    description: 'Amante de los momazos de buena calidad.',
    score: 150,
  },
  {
    id: 'user_2',
    username: 'AdminGatito',
    role: 'moderator',
    description: 'Moderador oficial del sitio.',
    score: 300,
  },
];

// ==========================================
// MEMES (3)
// ==========================================
export const mockMemes: Meme[] = [
  {
    id: 'meme_1',
    title: 'Cuando compila a la primera en TypeScript',
    imageUrl: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=500',
    author: mockUsers[0],
    status: 'approved',
    likes: 45,
    dislikes: 2,
    score: 43,
    createdAt: '2026-03-01T10:00:00Z',
  },
  {
    id: 'meme_2',
    title: 'Mi código a las 3 AM sin comentarios',
    imageUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=500',
    author: mockUsers[1],
    status: 'approved',
    likes: 120,
    dislikes: 5,
    score: 115,
    createdAt: '2026-03-02T14:30:00Z',
  },
  {
    id: 'meme_3',
    title: 'Esperando que el moderador apruebe mi momo',
    imageUrl: 'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=500',
    author: mockUsers[0],
    status: 'pending',
    likes: 0,
    dislikes: 0,
    score: 0,
    createdAt: '2026-03-03T09:15:00Z',
  },
];

// ==========================================
// COMENTARIOS (1 comentario + 1 respuesta por meme)
// ==========================================
export const mockComments: Comment[] = [
  // --- Para Meme 1 ---
  {
    id: 'comment_1',
    author: mockUsers[1],
    content: 'Eso es imposible, algo tuvo que haber quedado mal jajaja',
    parentId: 'meme_1',
    parentType: 'Meme',
    likes: 10,
    dislikes: 0,
    score: 10,
    createdAt: '2026-03-01T10:30:00Z',
  },
  {
    id: 'comment_1_reply',
    author: mockUsers[0],
    content: '¡Confía en el poder del tipado estricto!',
    parentId: 'comment_1',
    parentType: 'Comment',
    likes: 5,
    dislikes: 0,
    score: 5,
    createdAt: '2026-03-01T10:35:00Z',
  },

  // --- Para Meme 2 ---
  {
    id: 'comment_2',
    author: mockUsers[0],
    content: 'Confirmo, al día siguiente no sé qué escribí.',
    parentId: 'meme_2',
    parentType: 'Meme',
    likes: 25,
    dislikes: 1,
    score: 24,
    createdAt: '2026-03-02T15:00:00Z',
  },
  {
    id: 'comment_2_reply',
    author: mockUsers[1],
    content: 'Pro tip: no toques el código si ya funciona.',
    parentId: 'comment_2',
    parentType: 'Comment',
    likes: 12,
    dislikes: 0,
    score: 12,
    createdAt: '2026-03-02T15:10:00Z',
  },

];