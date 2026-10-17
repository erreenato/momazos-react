import { useSyncExternalStore } from 'react';
import { mockMemes, mockUsers } from './mockData';
import type { Meme, User } from './types';

// Usuario logueado simulado. Reemplazar por la autenticación real cuando exista.
// Para probar como moderador, cambiar el índice a 1 (AdminGatito).
export const CURRENT_USER: User = mockUsers[0];

// ---------------------------------------------------------------------------
// Estado compartido de memes, en memoria (simula la base de datos).
// Se reinicia al recargar la página.
//
// INTEGRACIÓN CON EL BACKEND: cuando estén los endpoints,
// reemplazar el cuerpo de estas funciones por llamadas HTTP:
//   publishMeme  -> POST  /api/memes                 (crea el meme como 'pending')
//   moderateMeme -> PATCH /api/memes/:id/status      (solo moderadores)
//   getMemes     -> GET   /api/memes ...             (el servidor filtra por rol)
// La regla de quién puede moderar y quién ve qué debe aplicarla el servidor;
// aquí solo se imita para poder probar el flujo.
// ---------------------------------------------------------------------------
let memes: Meme[] = [...mockMemes];
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getMemes(): Meme[] {
  return memes;
}

export function useMemes(): Meme[] {
  return useSyncExternalStore(subscribe, getMemes);
}

function authorIdOf(meme: Meme): string {
  return typeof meme.author === 'string' ? meme.author : meme.author.id;
}

// Un meme aprobado lo ve cualquiera; uno pendiente o rechazado, solo su
// autor o un moderador.
export function canSeeMeme(viewer: User | null, meme: Meme): boolean {
  if (meme.status === 'approved') return true;
  if (viewer === null) return false;
  return viewer.role === 'moderator' || viewer.id === authorIdOf(meme);
}

// Publicar: el meme siempre nace como 'pending'.
export function publishMeme(input: { title: string; imageUrl: string }): Meme {
  const meme: Meme = {
    id: `meme_local_${Date.now()}`,
    title: input.title,
    imageUrl: input.imageUrl,
    author: CURRENT_USER,
    status: 'pending',
    likes: 0,
    dislikes: 0,
    score: 0,
    createdAt: new Date().toISOString(),
  };
  memes = [meme, ...memes];
  emit();
  return meme;
}

// Moderar: solo un moderador, y solo sobre un meme pendiente
// (pendiente -> aprobado | rechazado). Devuelve false si no se aplicó.
export function moderateMeme(memeId: string, status: 'approved' | 'rejected'): boolean {
  if (CURRENT_USER.role !== 'moderator') return false;

  const target = memes.find((meme) => meme.id === memeId);
  if (!target || target.status !== 'pending') return false;

  memes = memes.map((meme) => (meme.id === memeId ? { ...meme, status } : meme));
  emit();
  return true;
}