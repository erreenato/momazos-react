import { mockUsers, mockMemes } from '../mockData';
import type { User } from '../types';

export function ProfileView() {
  const user: User = mockUsers[0];
  const userLabel = user.role === 'moderator' ? 'Admin' : 'Usuario normal';
  const memesCount = mockMemes.filter(
    (meme) => typeof meme.author !== 'string' && meme.author.id === user.id,
  ).length;

  return (
    <div>
      <h2>Vista: Perfil</h2>
      <p>Usuario: {user.username}</p>
      <p>Descripción: {user.description ?? 'Sin descripción.'}</p>
      <p>Tipo de usuario: {userLabel}</p>
      <p>Memes subidos: {memesCount}</p>
    </div>
  );
}