import { apiFetch } from './client';
import type { Comment, User } from '../types';

interface ApiComment extends Omit<Comment, 'id' | 'author' | 'parentId' | 'memeId'> {
  _id: string;
  author: string | { _id?: string; username: string; role?: User['role']; score?: number; avatarUrl?: string };
  parentId: string;
  memeId: string;
}

function normalizeComment(comment: ApiComment): Comment {
  const { _id, author, ...data } = comment;
  return {
    ...data,
    id: _id,
    author:
      typeof author === 'string'
        ? author
        : {
            id: author._id ?? author.username,
            username: author.username,
            role: author.role ?? 'user',
            score: author.score ?? 0,
            avatarUrl: author.avatarUrl,
          },
  };
}

export const postComment = async (content: string, parentId: string, parentType: 'Meme' | 'Comment' = 'Meme') => {
  const comment = await apiFetch<ApiComment>('/comments', {
    method: 'POST',
    body: { content, parentId, parentType },
  });
  return normalizeComment(comment);
};

export const getCommentsByMeme = async (memeId: string) => {
  const comments = await apiFetch<ApiComment[]>(`/comments/meme/${memeId}`);
  return comments.map(normalizeComment);
};