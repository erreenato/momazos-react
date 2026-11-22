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
 * Votar y comentar se prueban desde el feed de inicio (HomeView → MemeFeed), que ya usa datos
 * reales de la API. La página /meme/:id todavía lee memeStore (mock), por eso no se usa aquí:
 * ver navegacion.spec.ts.
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
    await page.getByLabel('Desde mi computador').check();
    await page.getByRole('button', { name: 'Publicar' }).click();

    await expect(page.locator('.subir-post-error')).toHaveText('Selecciona una imagen.');
    await expect(page.getByText('¡Tu momo quedó pendiente de moderación!')).toHaveCount(0);
  });

  test('el nombre de la imagen elegida se muestra antes de publicar', async ({ page, request }) => {
    const user = await createUserViaApi(request);
    await loginViaUi(page, user);

    await navLink(page, 'Subir Meme').click();
    await page.getByLabel('Desde mi computador').check();
    await page.getByLabel('Archivo').setInputFiles(fixturePath('meme.png'));

    await expect(page.locator('.subir-post-filename')).toHaveText('meme.png');
  });
});

test.describe('Votar y comentar (feed de inicio)', () => {
  test('error: un visitante no puede reaccionar ni comentar', async ({ page, request }) => {
    const [meme] = await getApprovedMemes(request);

    await page.goto('/');
    const card = memeCard(page, meme.title);

    await expect(card.locator('.meme-auth-hint')).toBeVisible();

    await card.locator('button.meme-pill.like').click();
    await expect(card.getByRole('alert')).toHaveText('Inicia sesión para reaccionar.');

    await card.locator('.meme-card-open').click();
    await expect(card.getByPlaceholder('Inicia sesión para comentar')).toBeDisabled();
  });

  test('un usuario con sesión puede dar like a un meme', async ({ page, request }) => {
    const user = await createUserViaApi(request);
    const [meme] = await getApprovedMemes(request);
    await loginViaUi(page, user);

    const like = memeCard(page, meme.title).locator('button.meme-pill.like');
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
