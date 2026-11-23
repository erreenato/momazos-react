import { expect, test } from '@playwright/test';
import {
  createUserViaApi,
  fixturePath,
  getApprovedMemes,
  loginViaUi,
  memeCard,
  navLink,
  publishMemeViaUi,
  uniqueTitle,
} from './support/helpers';

/**
 * Publicar (SubirPost.tsx), votar y comentar.
 *
 * Votar y comentar se prueban desde el feed de inicio (HomeView → MemeFeed). Tanto el feed
 * como la página /meme/:id usan datos reales de la API a través del store global de memes
 * (stores/memeStore.ts); la navegación a /meme/:id se prueba en navegacion.spec.ts.
 */

test.describe('Publicar un meme', () => {
  test('un usuario con sesión publica un meme y queda pendiente de moderación', async ({ page, request }) => {
    const user = await createUserViaApi(request);
    const title = uniqueTitle();
    await loginViaUi(page, user);

    await publishMemeViaUi(page, title);

    // Pendiente: todavía no aparece en el listado público.
    const approved = await getApprovedMemes(request);
    expect(approved.map((meme) => meme.title)).not.toContain(title);
  });

  test('error: no se puede publicar sin elegir una imagen', async ({ page, request }) => {
    const user = await createUserViaApi(request);
    await loginViaUi(page, user);

    await navLink(page, 'Subir Meme').click();
    await page.getByLabel('Título').fill(uniqueTitle());
    await page.getByRole('button', { name: 'Desde mi computador' }).click();
    await page.getByRole('button', { name: 'Publicar' }).click();

    await expect(page.getByRole('alert')).toHaveText('Selecciona una imagen.');
    await expect(page.getByText('¡Tu momo quedó pendiente de moderación!')).toHaveCount(0);
  });

  test('el nombre de la imagen elegida se muestra antes de publicar', async ({ page, request }) => {
    const user = await createUserViaApi(request);
    await loginViaUi(page, user);

    await navLink(page, 'Subir Meme').click();
    await page.getByRole('button', { name: 'Desde mi computador' }).click();
    await page.locator('#subir-archivo').setInputFiles(fixturePath('meme.png'));

    await expect(page.getByText('meme.png', { exact: true })).toBeVisible();
  });
});

test.describe('Votar y comentar (feed de inicio)', () => {
  test('error: un visitante no puede reaccionar ni comentar', async ({ page, request }) => {
    const [meme] = await getApprovedMemes(request);

    await page.goto('/');
    const card = memeCard(page, meme.title);

    await expect(card.getByText('Inicia sesión para reaccionar', { exact: true })).toBeVisible();

    await card.getByRole('button', { name: 'Me gusta', exact: true }).click();
    await expect(card.getByRole('alert')).toHaveText('Inicia sesión para reaccionar.');

    await card.locator('.meme-card-open').click();
    await expect(card.getByPlaceholder('Inicia sesión para comentar')).toBeDisabled();
  });

  test('un usuario con sesión puede dar like a un meme', async ({ page, request }) => {
    const user = await createUserViaApi(request);
    const [meme] = await getApprovedMemes(request);
    await loginViaUi(page, user);

    const like = memeCard(page, meme.title).getByRole('button', { name: 'Me gusta', exact: true });
    const before = Number((await like.innerText()).trim());

    await like.click();

    // El usuario es nuevo y no había votado: el contador sube exactamente 1.
    await expect(like).toHaveAttribute('aria-pressed', 'true');
    await expect(like).toHaveText(String(before + 1));
  });

  test('un usuario con sesión puede comentar y el comentario persiste tras recargar', async ({ page, request }) => {
    const user = await createUserViaApi(request);
    const [meme] = await getApprovedMemes(request);
    const comment = uniqueTitle('Comentario E2E');
    await loginViaUi(page, user);

    const card = memeCard(page, meme.title);
    await card.locator('.meme-card-open').click();
    await card.getByPlaceholder('Añade un comentario').fill(comment);
    await card.getByRole('button', { name: 'Enviar comentario' }).click();
    await expect(card.getByText(comment)).toBeVisible();

    await page.reload();
    await card.locator('.meme-card-open').click();
    await expect(card.getByText(comment)).toBeVisible();
  });
});
