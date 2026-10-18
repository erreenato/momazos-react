
import { apiFetch, ApiError } from '../api/client';
import type { Meme, User } from '../types';

interface ApiMeme extends Omit<Meme, 'id' | 'author'> {
  _id: string;
  author: string | { id?: string; username: string };
}

export function canViewPrivateMemes(
  viewer: User | null,
  owner: User,
): boolean {
  return viewer !== null &&
    (viewer.id === owner.id || viewer.role === 'moderator');
}

export async function getUserById(id: string): Promise<User | null> {
  try {
    return await apiFetch<User>(`/users/${encodeURIComponent(id)}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function getUserMemes(userId: string): Promise<Meme[]> {
  const memes = await apiFetch<ApiMeme[]>(
    `/users/${encodeURIComponent(userId)}/memes`,
  );

  return memes.map(({ _id, author, ...meme }) => ({
    ...meme,
    id: _id,
    author: typeof author === 'string' ? author : author.username,
  }));
}

export async function updateMyProfile(
  changes: Pick<User, 'description' | 'avatarUrl'>,
): Promise<User> {
  return apiFetch<User>('/users/me', {
    method: 'PATCH',
    body: changes,
  });
}

export async function deleteMyMeme(memeId: string): Promise<void> {
  await apiFetch(`/memes/${encodeURIComponent(memeId)}`, {
    method: 'DELETE',
  });
}