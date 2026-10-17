import { mockMemes, mockUsers } from '../mockData';
import type { Meme, User } from '../types';

// Usuario logueado simulado. Reemplazar por la autenticación real cuando exista.
// Para probar la vista de moderador, cambiar el índice a 1 (AdminGatito).
const CURRENT_USER = mockUsers[0];

// Regla de visibilidad: los memes que no están aprobados (pendientes y
// rechazados) solo los ve el dueño del perfil o un moderador.
export function canViewPrivateMemes(viewer: User | null, owner: User): boolean {
  return viewer !== null && (viewer.id === owner.id || viewer.role === 'moderator');
}

// ---------------------------------------------------------------------------
// INTEGRACIÓN CON EL BACKEND
// Hoy estas funciones usan mockData. Cuando estén los endpoints, reemplazar el cuerpo por:
//   getUserById  -> fetch(`/api/users/${id}`, { credentials: 'include' })
//   getUserMemes -> fetch(`/api/users/${id}/memes`, { credentials: 'include' })
// ---------------------------------------------------------------------------

export async function getUserById(id: string): Promise<User | null> {
  return mockUsers.find((user) => user.id === id) ?? null;
}

export async function getUserMemes(userId: string): Promise<Meme[]> {
  const owner = mockUsers.find((user) => user.id === userId);
  if (!owner) return [];

  const memes = mockMemes.filter(
    (meme) => typeof meme.author !== 'string' && meme.author.id === userId,
  );

  return canViewPrivateMemes(CURRENT_USER, owner)
    ? memes
    : memes.filter((meme) => meme.status === 'approved');
}
