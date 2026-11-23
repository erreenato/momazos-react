import { expect, test } from '@playwright/test';
import { API_URL } from './support/env';
import {
  createUserViaApi,
  loginViaUi,
  navLink,
  readStoredSession,
  uniqueUser,
} from './support/helpers';

/**
 * Autenticación (AuthProvider.tsx, LoginView.tsx, RegisterView.tsx, ProtectedRoute.tsx).
 * El JWT viaja en una cookie httpOnly; en localStorage solo queda `momazos.session`
 * (usuario + token CSRF), que es lo que permite restaurar la sesión tras un F5.
 */

test.describe('Registro', () => {
  test('un visitante puede registrarse y queda con la sesión iniciada', async ({ page }) => {
    const user = uniqueUser();

    await page.goto('/registro');
    await page.getByLabel('Nombre de usuario').fill(user.username);
    await page.getByLabel('Email').fill(user.email);
    await page.locator('#register-password').fill(user.password);
    await page.getByLabel('Repite la contraseña').fill(user.password);
    await page.getByRole('button', { name: 'Registrarme' }).click();

    await expect(page).toHaveURL('/');
    await expect(page.getByText(`@${user.username}`)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Cerrar sesión' })).toBeVisible();
    expect(await readStoredSession(page)).not.toBeNull();
  });

  test('error: las contraseñas no coinciden', async ({ page }) => {
    const user = uniqueUser();

    await page.goto('/registro');
    await page.getByLabel('Nombre de usuario').fill(user.username);
    await page.getByLabel('Email').fill(user.email);
    await page.locator('#register-password').fill(user.password);
    await page.getByLabel('Repite la contraseña').fill('otra-contraseña-123');
    await page.getByRole('button', { name: 'Registrarme' }).click();

    await expect(page.getByRole('alert')).toHaveText('Las contraseñas no coinciden');
    await expect(page).toHaveURL('/registro');
    expect(await readStoredSession(page)).toBeNull();
  });

  test('error: no se puede registrar un email que ya existe', async ({ page, request }) => {
    const existing = await createUserViaApi(request);
    const other = uniqueUser();

    await page.goto('/registro');
    await page.getByLabel('Nombre de usuario').fill(other.username);
    await page.getByLabel('Email').fill(existing.email);
    await page.locator('#register-password').fill(other.password);
    await page.getByLabel('Repite la contraseña').fill(other.password);
    await page.getByRole('button', { name: 'Registrarme' }).click();

    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page).toHaveURL('/registro');
    expect(await readStoredSession(page)).toBeNull();
  });
});

test.describe('Inicio de sesión', () => {
  test('un usuario existente puede iniciar sesión', async ({ page, request }) => {
    const user = await createUserViaApi(request);

    await page.goto('/login');
    await page.getByLabel('Email').fill(user.email);
    await page.getByLabel('Contraseña').fill(user.password);
    await page.getByRole('button', { name: 'Entrar' }).click();

    await expect(page).toHaveURL('/');
    await expect(page.getByText(`@${user.username}`)).toBeVisible();
    expect(await readStoredSession(page)).not.toBeNull();
  });

  test('error: credenciales inválidas muestran un mensaje y no inician sesión', async ({ page, request }) => {
    const user = await createUserViaApi(request);

    await page.goto('/login');
    await page.getByLabel('Email').fill(user.email);
    await page.getByLabel('Contraseña').fill('contraseña-incorrecta');
    await page.getByRole('button', { name: 'Entrar' }).click();

    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page).toHaveURL('/login');
    expect(await readStoredSession(page)).toBeNull();
  });

  test('después de iniciar sesión vuelve a la ruta protegida que se quería visitar', async ({ page, request }) => {
    const user = await createUserViaApi(request);

    await page.goto('/subir');
    await expect(page).toHaveURL('/login');

    await page.getByLabel('Email').fill(user.email);
    await page.getByLabel('Contraseña').fill(user.password);
    await page.getByRole('button', { name: 'Entrar' }).click();

    await expect(page).toHaveURL('/subir');
    await expect(page.getByRole('heading', { name: 'Subir un momo' })).toBeVisible();
  });
});

test.describe('Sesión', () => {
  test('la sesión sobrevive a recargar una ruta protegida (F5)', async ({ page, request }) => {
    const user = await createUserViaApi(request);
    await loginViaUi(page, user);

    await navLink(page, 'Subir Meme').click();
    await expect(page).toHaveURL('/subir');

    await page.reload();

    await expect(page).toHaveURL('/subir');
    await expect(page.getByRole('heading', { name: 'Subir un momo' })).toBeVisible();
    await expect(page.getByText(`@${user.username}`)).toBeVisible();
  });

  test('cerrar sesión limpia la sesión y vuelve a proteger las rutas', async ({ page, request }) => {
    const user = await createUserViaApi(request);
    await loginViaUi(page, user);

    await page.getByRole('button', { name: 'Cerrar sesión' }).click();

    await expect(page).toHaveURL('/login');
    await expect(page.getByRole('link', { name: 'Iniciar sesión' })).toBeVisible();
    expect(await readStoredSession(page)).toBeNull();

    // El servidor también debe haber invalidado la cookie.
    const me = await page.request.get(`${API_URL}/auth/me`);
    expect(me.ok(), 'GET /auth/me debe fallar después del logout').toBeFalsy();

    await page.goto('/subir');
    await expect(page).toHaveURL('/login');
  });
});

test.describe('Permisos', () => {
  test('un usuario normal no puede entrar a /moderacion', async ({ page, request }) => {
    const user = await createUserViaApi(request);
    await loginViaUi(page, user);

    await expect(navLink(page, 'Moderación')).toHaveCount(0);

    await page.goto('/moderacion');
    await expect(page.getByText('No tienes permisos para ver esta página.')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Moderación' })).toHaveCount(0);
  });
});
