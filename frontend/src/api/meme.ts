import { apiFetch } from './client';

// Obtener los memes aprobados
export const getApprovedMemes = async () => {
  return apiFetch<any[]>('/memes');
};

// Reaccionar a un meme (Like / Dislike)
export const reactToMeme = async (memeId: string, type: 'like' | 'dislike') => {
  return apiFetch<{ message: string; meme: any }>(`/memes/${memeId}/react`, {
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