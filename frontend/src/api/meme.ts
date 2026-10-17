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