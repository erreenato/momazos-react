import { apiFetch } from './client';
import type { Meme, MemeStatus, ReactionType, User } from '../types';

export interface MemeReactionResponse {
  message: string;
  meme: {
    id: string;
    likes: number;
    dislikes: number;
    score: number;
    myReaction: ReactionType | null;
  };
}

/** Autor tal como llega del backend: un id/texto, o un objeto con `_id` o `id`. */
type ApiAuthor =
  | string
  | {
      _id?: string;
      id?: string;
      username: string;
      role?: User['role'];
      score?: number;
      avatarUrl?: string;
    };

/**
 * Meme tal como llega del backend. Según el endpoint viene con `_id` (GET /memes,
 * /users/:id/memes, POST /memes) o con `id` (/moderation/memes, PATCH status).
 */
export interface ApiMeme extends Omit<Meme, 'id' | 'author'> {
  _id?: string;
  id?: string;
  author: ApiAuthor | null;
}

export interface RankingUser {
  _id: string;
  username: string;
  score: number;
  avatarUrl?: string;
}

function normalizeAuthor(author: ApiAuthor | null): User | string {
  if (author === null) return 'Usuario eliminado';
  if (typeof author === 'string') return author;
  return {
    id: author.id ?? author._id ?? author.username,
    username: author.username,
    role: author.role ?? 'user',
    score: author.score ?? 0,
    avatarUrl: author.avatarUrl,
  };
}

/** Convierte cualquier respuesta de meme del backend al tipo `Meme` del frontend. */
export function normalizeMeme(meme: ApiMeme): Meme {
  return {
    id: String(meme.id ?? meme._id),
    title: meme.title,
    imageUrl: meme.imageUrl,
    author: normalizeAuthor(meme.author),
    status: meme.status,
    likes: meme.likes ?? 0,
    dislikes: meme.dislikes ?? 0,
    score: meme.score ?? 0,
    createdAt: meme.createdAt,
    tags: meme.tags,
    myReaction: meme.myReaction ?? null,
  };
}

// Obtener los memes aprobados
export const getApprovedMemes = async () => {
  const memes = await apiFetch<ApiMeme[]>('/memes');
  return memes.map(normalizeMeme);
};

// Obtener un meme por id. El backend también lo entrega si está pendiente o
// rechazado, siempre que quien lo pide sea su autor o un moderador.
export const getMemeById = async (memeId: string) => {
  const meme = await apiFetch<ApiMeme>(`/memes/${encodeURIComponent(memeId)}`);
  return normalizeMeme(meme);
};

// Publicar un meme (título + URL o archivo). Siempre nace como 'pending'.
export const createMeme = async (data: FormData) => {
  const meme = await apiFetch<ApiMeme>('/memes', { method: 'POST', body: data });
  return normalizeMeme(meme);
};

// Eliminar un meme (solo su autor o un moderador).
export const deleteMeme = async (memeId: string) => {
  await apiFetch<void>(`/memes/${encodeURIComponent(memeId)}`, { method: 'DELETE' });
};

// Reaccionar a un meme (Like / Dislike). Requiere sesión.
export const reactToMeme = async (memeId: string, type: ReactionType) => {
  return apiFetch<MemeReactionResponse>(`/memes/${encodeURIComponent(memeId)}/react`, {
    method: 'POST',
    body: { type },
  });
};

// Memes de un usuario. El backend incluye los pendientes/rechazados solo si
// quien pide es el propio usuario o un moderador.
export const getUserMemes = async (userId: string) => {
  const memes = await apiFetch<ApiMeme[]>(`/users/${encodeURIComponent(userId)}/memes`);
  return memes.map(normalizeMeme);
};

// Memes pendientes de moderación (solo moderadores).
export const getPendingMemes = async () => {
  const memes = await apiFetch<ApiMeme[]>('/moderation/memes');
  return memes.map(normalizeMeme);
};

// Aprobar o rechazar un meme (solo moderadores).
export const updateMemeStatus = async (memeId: string, status: Exclude<MemeStatus, 'pending'>) => {
  const meme = await apiFetch<ApiMeme>(`/memes/${encodeURIComponent(memeId)}/status`, {
    method: 'PATCH',
    body: { status },
  });
  return normalizeMeme(meme);
};

// Obtener los mejores 10 memes
export const getTopMemes = async () => {
  const memes = await apiFetch<ApiMeme[]>('/memes/ranking');
  return memes.map(normalizeMeme);
};

// Obtener los 10 peores memes (anti-ranking)
export const getBottomMemes = async () => {
  const memes = await apiFetch<ApiMeme[]>('/memes/anti-ranking');
  return memes.map(normalizeMeme);
};

// Obtener los mejores 10 usuarios
export const getTopUsers = async () => {
  return apiFetch<RankingUser[]>('/users/ranking');
};

// Obtener los 10 usuarios con peor puntaje (anti-ranking)
export const getBottomUsers = async () => {
  return apiFetch<RankingUser[]>('/users/anti-ranking');
};
