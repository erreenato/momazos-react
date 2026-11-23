import { expect, test } from '@playwright/test';
import {
  createUserViaApi,
  getApprovedMemes,
  loginViaUi,
  memeCard,
  navLink,
  openModeratorPage,
  publishMemeViaUi,
  uniqueTitle,
} from './support/helpers';

/**
 * Moderación (ModerationView.tsx). Cada prueba publica su propio meme con un título único
 * y modera solo ese, así no depende de los memes pendientes que deje el seed.
 *
 * Se usan dos contextos de navegador: el usuario normal y el moderador (admin@memes.com).
 */

test.describe('Moderación', () => {
  test('el moderador ve el link y la página de moderación', async ({ browser }) => {
    const { page, context } = await openModeratorPage(browser);
    try {
      await navLink(page, 'Moderación').click();

      await expect(page).toHaveURL('/moderacion');
      await expect(page.getByRole('heading', { name: 'Moderación', level: 1 })).toBeVisible();
      // El seed deja 3 memes pendientes.
      await expect(page.getByRole('table', { name: 'Memes pendientes de moderación' }).locator('tbody tr').first()).toBeVisible();
    } finally {
      await context.close();
    }
  });

  test('el moderador puede aprobar un meme pendiente y pasa a ser público', async ({ page, request, browser }) => {
    const user = await createUserViaApi(request);
    const title = uniqueTitle();
    await loginViaUi(page, user);
    await publishMemeViaUi(page, title);

    const { page: moderator, context } = await openModeratorPage(browser);
    try {
      await navLink(moderator, 'Moderación').click();

      const card = moderator.getByRole('table', { name: 'Memes pendientes de moderación' }).locator('tbody tr').filter({ hasText: title });
      await expect(card).toHaveCount(1);
      await expect(card).toContainText(user.username);

      await card.getByRole('button', { name: 'Aprobar' }).click();

      await expect(moderator.getByText('Meme aprobado correctamente.')).toBeVisible();
      await expect(card).toHaveCount(0);
    } finally {
      await context.close();
    }

    const approved = await getApprovedMemes(request);
    expect(approved.map((meme) => meme.title)).toContain(title);

    // Y ahora cualquiera lo ve en el feed de inicio.
    await navLink(page, 'Inicio').click();
    await expect(memeCard(page, title)).toBeVisible();
  });

  test('el moderador puede rechazar un meme pendiente y no se hace público', async ({ page, request, browser }) => {
    const user = await createUserViaApi(request);
    const title = uniqueTitle();
    await loginViaUi(page, user);
    await publishMemeViaUi(page, title);

    const { page: moderator, context } = await openModeratorPage(browser);
    try {
      await navLink(moderator, 'Moderación').click();

      const card = moderator.getByRole('table', { name: 'Memes pendientes de moderación' }).locator('tbody tr').filter({ hasText: title });
      await expect(card).toHaveCount(1);

      await card.getByRole('button', { name: 'Rechazar' }).click();
      // Rechazar pide confirmación en un ConfirmDialog.
      await moderator.getByRole('dialog').getByRole('button', { name: 'Rechazar' }).click();

      await expect(moderator.getByText('Meme rechazado correctamente.')).toBeVisible();
      await expect(card).toHaveCount(0);
    } finally {
      await context.close();
    }

    const approved = await getApprovedMemes(request);
    expect(approved.map((meme) => meme.title)).not.toContain(title);

    // Tampoco aparece en el feed de inicio (se espera a que el feed haya cargado).
    await navLink(page, 'Inicio').click();
    await expect(page.locator('article.meme-card').first()).toBeVisible();
    await expect(memeCard(page, title)).toHaveCount(0);
  });
});
