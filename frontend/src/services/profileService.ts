
import { apiFetch, ApiError } from '../api/client';
import type { User } from '../types';

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

export async function updateMyProfile(
  changes: Pick<User, 'description' | 'avatarUrl'>,
): Promise<User> {
  return apiFetch<User>('/users/me', {
    method: 'PATCH',
    body: changes,
  });
}
