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
}

export interface Comment {
  id: string;
  author: User | string;
  content: string;
  parentId: string; // ID del Meme o de otro Comment
  parentType: 'Meme' | 'Comment';
  likes: number;
  dislikes: number;
  score: number; // <--- Nuevo campo
  createdAt?: string;
}