export type Role = 'user' | 'moderator';
export type MemeStatus = 'pending' | 'approved' | 'rejected';
export type ReactionType = 'like' | 'dislike';

export interface User {
  id: string;
  username: string;
  role: Role;
  description?: string;
  score: number;
  avatarUrl?: string;
}

export interface Meme {
  id: string;
  title: string;
  imageUrl: string;
  author: User | string;
  status: MemeStatus;
  likes: number;
  dislikes: number;
  score: number;
  createdAt?: string;
  tags?: string[];
  /** Voto del usuario en sesión (null si es anónimo o no ha votado). */
  myReaction?: ReactionType | null;
}

export interface Comment {
  id: string;
  author: User | string;
  content: string;
  parentId: string; // ID del Meme o de otro Comment
  parentType: 'Meme' | 'Comment';
  memeId?: string; // ID del Meme al que pertenece el comentario
  likes: number;
  dislikes: number;
  score: number;
  createdAt?: string;
  /** Voto del usuario en sesión (null si es anónimo o no ha votado). */
  myReaction?: ReactionType | null;
}

/**
 * Formato de error que guardan los stores. `message` viene del body `{ error }`
 * del backend (o un texto por defecto) y `status` es el código HTTP, si lo hubo.
 */
export interface StoreError {
  message: string;
  status?: number;
}
