/**
 * Configuración compartida por playwright.config.ts y las pruebas.
 *
 * Modo local (por defecto): Playwright levanta el backend con MongoDB en memoria
 * (`npm run dev:backend:memory`, ya sembrado) y el frontend con Vite. No toca ninguna
 * base de datos real y cada corrida parte de datos limpios.
 *
 * Modo despliegue: define E2E_BASE_URL y Playwright no levanta nada.
 *   E2E_BASE_URL=https://fullstack.dcc.uchile.cl:7039 npx playwright test --grep @readonly
 * OJO: las pruebas que no son @readonly crean usuarios y memes en esa base de datos.
 */
const BASE = process.env.E2E_BASE_URL?.replace(/\/+$/, '');

export const IS_DEPLOYED = Boolean(BASE);

export const LOCAL_FRONTEND_URL = 'http://localhost:5173';
export const LOCAL_API_URL = 'http://localhost:4000/api';

export const FRONTEND_URL = BASE ?? LOCAL_FRONTEND_URL;

/** En el despliegue el backend sirve el frontend, así que la API vive en el mismo origen. */
export const API_URL = process.env.E2E_API_URL ?? (BASE ? `${BASE}/api` : LOCAL_API_URL);

/** Moderador creado por el seed (ver README). */
export const MODERATOR = {
  email: 'admin@memes.com',
  password: 'password123',
} as const;
