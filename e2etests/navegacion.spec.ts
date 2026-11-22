import { expect, test } from '@playwright/test';
import { getApprovedMemes, memeCard, navLink } from './support/helpers';

/**
 * Rutas y navegación (App.tsx, ProtectedRoute.tsx, TopNav.tsx). No requieren sesión y
 * solo leen datos, por eso llevan la etiqueta @readonly (se pueden correr contra el despliegue:
 * `npx playwright test --grep @readonly`).
 *
 *  - públicas: /, /ranking, /anti-ranking, /meme/:id, /login, /registro
 *  - protegidas: /perfil, /perfil/:id, /subir
 *  - solo moderador: /moderacion
 *  - cualquier otra ruta redirige a "/"
 */

test.describe('Rutas públicas @readonly', () => {
  test('la página principal carga', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('link', { name: 'momazos', exact: true })).toBeVisible();
    await expect(navLink(page, 'Inicio')).toBeVisible();
  });

  test('la página principal muestra los memes reales de la API, no los mock', async ({ page, request }) => {
    const memes = await getApprovedMemes(request);
    expect(memes.length, 'el seed debe dejar memes aprobados').toBeGreaterThan(0);

    await page.goto('/');

    await expect(page.getByRole('heading', { name: '¡Bienvenido!' })).toBeVisible();
    await expect(memeCard(page, memes[0].title)).toBeVisible();
    // Mismo número de tarjetas que memes aprobados en la API.
    await expect(page.locator('article.meme-card')).toHaveCount(memes.length);
  });

  test('se llega al ranking y al anti-ranking desde el menú', async ({ page }) => {
    await page.goto('/');

    await navLink(page, 'Ranking Memes').click();
    await expect(page).toHaveURL('/ranking');

    await navLink(page, 'Anti-Ranking').click();
    await expect(page).toHaveURL('/anti-ranking');
  });

  test('el menú no muestra Moderación a un visitante', async ({ page }) => {
    await page.goto('/');
    await expect(navLink(page, 'Moderación')).toHaveCount(0);
  });
});

test.describe('Detalle de un meme @readonly', () => {
  test('el acceso directo a /meme/:id muestra ese meme', async ({ page, request }) => {
    const [meme] = await getApprovedMemes(request);
    expect(meme, 'el seed debe dejar al menos un meme aprobado').toBeTruthy();

    await page.goto(`/meme/${meme._id}`);
    await expect(page).toHaveURL(`/meme/${meme._id}`);
    await expect(page.getByText('Momo no encontrado')).toHaveCount(0);
    await expect(page.locator('.meme-pin-title')).toHaveText(meme.title);
  });

  test('recargar /meme/:id mantiene la ruta y el meme', async ({ page, request }) => {
    const [meme] = await getApprovedMemes(request);

    await page.goto(`/meme/${meme._id}`);
    await page.reload();
    await expect(page).toHaveURL(`/meme/${meme._id}`);
    await expect(page.locator('.meme-pin-title')).toHaveText(meme.title);
  });

  test('un id inexistente muestra "Momo no encontrado"', async ({ page }) => {
    await page.goto('/meme/000000000000000000000000');
    await expect(page.getByRole('heading', { name: 'Momo no encontrado' })).toBeVisible();

    await page.getByRole('link', { name: 'Volver a Momazos' }).click();
    await expect(page).toHaveURL('/');
  });
});

test.describe('Rutas protegidas sin sesión @readonly', () => {
  for (const ruta of ['/subir', '/perfil', '/moderacion']) {
    test(`${ruta} redirige a /login`, async ({ page }) => {
      await page.goto(ruta);
      await expect(page).toHaveURL('/login');
    });
  }
});

test.describe('Rutas inexistentes @readonly', () => {
  test('una ruta desconocida redirige a la página principal', async ({ page }) => {
    await page.goto('/esta-ruta-no-existe');
    await expect(page).toHaveURL('/');
  });
});

test.describe('Historial y recarga @readonly', () => {
  test('back y forward recorren las rutas visitadas', async ({ page }) => {
    await page.goto('/');
    await navLink(page, 'Ranking Memes').click();
    await expect(page).toHaveURL('/ranking');
    await navLink(page, 'Anti-Ranking').click();
    await expect(page).toHaveURL('/anti-ranking');

    await page.goBack();
    await expect(page).toHaveURL('/ranking');
    await page.goBack();
    await expect(page).toHaveURL('/');

    await page.goForward();
    await expect(page).toHaveURL('/ranking');
    await page.goForward();
    await expect(page).toHaveURL('/anti-ranking');
  });

  test('recargar una ruta interna no produce error', async ({ page }) => {
    await page.goto('/');
    await navLink(page, 'Ranking Memes').click();
    await expect(page).toHaveURL('/ranking');

    await page.reload();
    await expect(page).toHaveURL('/ranking');
    await expect(navLink(page, 'Ranking Memes')).toBeVisible();
  });
});
