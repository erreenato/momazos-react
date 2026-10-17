import { apiFetch } from './client';
import type { Meme } from '../types';

export interface MemeReactionResponse {
  message: string;
  meme: {
    id: string;
    likes: number;
    dislikes: number;
    score: number;
  };
}

interface ApiMeme extends Omit<Meme, 'id' | 'author'> {
  _id: string;
  author: string | { username: string };
}

// Obtener los memes aprobados
export const getApprovedMemes = async () => {
  const memes = await apiFetch<ApiMeme[]>('/memes');
  return memes.map(({ _id, author, ...meme }) => ({
    ...meme,
    id: _id,
    author: typeof author === 'string' ? author : author.username,
  }));
};

// Reaccionar a un meme (Like / Dislike)
export const reactToMeme = async (memeId: string, type: 'like' | 'dislike') => {
  return apiFetch<MemeReactionResponse>(`/memes/${memeId}/react`, {
    method: 'POST',
    body: { type },
  });
};

// Obtener los mejores 10 memes
export const getTopMemes = async () => {
  return apiFetch<any[]>('/memes/ranking');
};

// Obtener los mejores 10 usuarios
export const getTopUsers = async () => {
  return apiFetch<any[]>('/users/ranking');
};
