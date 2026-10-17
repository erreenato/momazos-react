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

export interface RankingUser {
  _id: string;
  username: string;
  score: number;
  avatarUrl?: string;
}

function normalizeMeme({ _id, author, ...meme }: ApiMeme): Meme {
  return {
    ...meme,
    id: _id,
    author: typeof author === 'string' ? author : author.username,
  };
}

// Obtener los memes aprobados
export const getApprovedMemes = async () => {
  const memes = await apiFetch<ApiMeme[]>('/memes');
  return memes.map(normalizeMeme);
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
  const memes = await apiFetch<ApiMeme[]>('/memes/ranking');
  return memes.map(normalizeMeme);
};

// Obtener los mejores 10 usuarios
export const getTopUsers = async () => {
  return apiFetch<RankingUser[]>('/users/ranking');
};
