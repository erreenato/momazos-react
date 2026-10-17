export interface User {
  id: string;
  username: string;
  role: 'user' | 'moderator';
  description?: string;
  score: number;
  avatarUrl?: string;
}

export interface Meme {
  id: string;
  title: string;
  imageUrl: string;
  author: User | string;
  status: 'pending' | 'approved' | 'rejected';
  likes: number;
  dislikes: number;
  score: number;
  createdAt?: string;
  tags?: string[];
  /** Voto del usuario en sesión (null si es anónimo o no ha votado). */
  myReaction?: 'like' | 'dislike' | null;
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
  score: number; // <--- Nuevo campo
  createdAt?: string;
  /** Voto del usuario en sesión (null si es anónimo o no ha votado). */
  myReaction?: 'like' | 'dislike' | null;
}