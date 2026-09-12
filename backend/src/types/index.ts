export interface User {
  id: string;
  username: string;
  role: 'user' | 'moderator';
  description?: string;
  score: number;
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
}

export interface Comment {
  id: string;
  author: User | string;
  content: string;
  parentId: string; // ID del Meme o de otro Comment
  parentType: 'Meme' | 'Comment';
  likes: number;
  dislikes: number;
  createdAt?: string;
}