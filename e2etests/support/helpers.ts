import path from 'node:path';
import { expect, test, type APIRequestContext, type Browser, type BrowserContext, type Page } from '@playwright/test';
import { API_URL, FRONTEND_URL, MODERATOR } from './env';

export interface Credentials {
  email: string;
  password: string;
}

export interface TestUser extends Credentials {
  username: string;
}

/** Clave que usa la app en localStorage (frontend/src/auth/session.ts). */
export const SESSION_KEY = 'momazos.session';

// ---------------------------------------------------------------------------
// Datos únicos por prueba
// Cada prueba crea sus propios usuarios y memes con nombres únicos, así no depende
// de lo que dejaron otras pruebas ni de corridas anteriores.
// ---------------------------------------------------------------------------

let sequence = 0;

function uniqueSuffix(): string {
  sequence += 1;
  // Ancho fijo: ningún sufijo es prefijo de otro.
  return `${Date.now().toString(36)}${String(sequence).padStart(3, '0')}`;
}

export function uniqueUser(): TestUser {
  const suffix = uniqueSuffix();
  return {
    username: `e2e${suffix}`,
    email: `e2e${suffix}@example.com`,
    password: 'password123',
  };
}

export function uniqueTitle(prefix = 'Meme E2E'): string {
  return `${prefix} ${uniqueSuffix()}`;
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

/** Crea un usuario normal directamente en la API (rápido, no pasa por la interfaz). */
export async function createUserViaApi(request: APIRequestContext): Promise<TestUser> {
  const user = uniqueUser();
  const res = await request.post(`${API_URL}/auth/register`, { data: user });
  expect(res.ok(), `POST /auth/register falló: ${res.status()} ${await res.text()}`).toBeTruthy();
  return user;
}

export interface ApiMemeLite {
  _id: string;
  title: string;
}

/** Memes aprobados (lo que ve cualquier visitante). */
export async function getApprovedMemes(request: APIRequestContext): Promise<ApiMemeLite[]> {
  const res = await request.get(`${API_URL}/memes`);
  expect(res.ok(), `GET /memes falló: ${res.status()}`).toBeTruthy();
  return (await res.json()) as ApiMemeLite[];
}

// ---------------------------------------------------------------------------
// Interfaz
// ---------------------------------------------------------------------------

/** Link del menú principal (TopNav). */
export function navLink(page: Page, name: string) {
  return page
    .getByRole('navigation', { name: 'Navegación principal' })
    .getByRole('link', { name, exact: true });
}

/** Tarjeta de un meme en el feed de inicio (MemeFeed → MemeFeedCard). */
export function memeCard(page: Page, title: string) {
  return page.locator('article.meme-card').filter({ hasText: title });
}

export async function loginViaUi(page: Page, credentials: Credentials): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Email').fill(credentials.email);
  await page.getByLabel('Contraseña').fill(credentials.password);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByRole('button', { name: 'Cerrar sesión' })).toBeVisible();
}

export async function readStoredSession(page: Page): Promise<string | null> {
  return page.evaluate((key) => localStorage.getItem(key), SESSION_KEY);
}

export function fixturePath(fileName: string): string {
  return path.join(test.info().project.testDir, 'fixtures', fileName);
}

/** Publica un meme desde /subir subiendo la imagen de prueba. Requiere sesión iniciada. */
export async function publishMemeViaUi(page: Page, title: string): Promise<void> {
  await navLink(page, 'Subir Meme').click();
  await page.getByLabel('Título').fill(title);
  await page.getByLabel('Desde mi computador').check();
  await page.getByLabel('Archivo').setInputFiles(fixturePath('meme.png'));
  await page.getByRole('button', { name: 'Publicar' }).click();
  await expect(page.getByText('¡Tu momo quedó pendiente de moderación!')).toBeVisible();
}

/**
 * Abre una sesión de moderador en un contexto de navegador aparte, para poder tener
 * al usuario normal y al moderador al mismo tiempo dentro de una prueba.
 */
export async function openModeratorPage(
  browser: Browser,
): Promise<{ page: Page; context: BrowserContext }> {
  const context = await browser.newContext({ baseURL: FRONTEND_URL });
  const page = await context.newPage();
  await loginViaUi(page, MODERATOR);
  return { page, context };
}
