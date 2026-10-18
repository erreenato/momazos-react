import { after, before, beforeEach, describe, test } from 'node:test';
import assert from 'node:assert';
import { Comment } from '../../src/models/Comment.js';
import { Meme } from '../../src/models/Meme.js';
import { User } from '../../src/models/User.js';
import {
  api,
  closeTestDb,
  connectTestDb,
  login,
  moderatorUser,
  nonExistingId,
  normalUser,
  resetDb,
  type TestSession,
} from '../test_helper.js';

let user: TestSession;
let moderator: TestSession;

before(async () => {
  await connectTestDb();
});

beforeEach(async () => {
  await resetDb();
  user = await login({ email: normalUser.email, password: normalUser.password });
  moderator = await login({ email: moderatorUser.email, password: moderatorUser.password });
});

after(async () => {
  await closeTestDb();
});

describe('GET /api/users', () => {
  test('lists public user data without credentials', async () => {
    const result = await api.get('/api/users').expect(200);

    assert.strictEqual(result.body.length, 2);
    assert(result.body.every((entry: Record<string, unknown>) => !('email' in entry)));
    assert(result.body.every((entry: Record<string, unknown>) => !('passwordHash' in entry)));
  });
});

describe('POST /api/users', () => {
  test('creates a regular user using the registration flow', async () => {
    const result = await api
      .post('/api/users')
      .send({ username: 'NuevoUsuario', email: 'nuevo@users.test', password: 'secreto789' })
      .expect(201);

    assert.strictEqual(result.body.username, 'NuevoUsuario');
    assert.strictEqual(result.body.role, 'user');
    assert(!('passwordHash' in result.body));
  });
});

describe('PATCH /api/users/:id', () => {
  test('allows the owner to update public account fields', async () => {
    const currentUser = await User.findOne({ username: normalUser.username });
    const result = await api
      .patch(`/api/users/${String(currentUser?._id)}`)
      .set('Cookie', user.cookie)
      .set('X-CSRF-Token', user.csrfToken)
      .send({ username: 'UsuarioEditado', email: 'editado@users.test', description: 'Descripción nueva' })
      .expect(200);

    assert.strictEqual(result.body.username, 'UsuarioEditado');
    assert.strictEqual(result.body.description, 'Descripción nueva');
    assert.strictEqual((await User.findById(currentUser?._id))?.email, 'editado@users.test');
  });

  test('rejects unauthorized and protected fields', async () => {
    const target = await User.findOne({ username: moderatorUser.username });

    await api
      .patch(`/api/users/${String(target?._id)}`)
      .set('Cookie', user.cookie)
      .set('X-CSRF-Token', user.csrfToken)
      .send({ description: 'No autorizado' })
      .expect(403);

    await api
      .patch(`/api/users/${String(target?._id)}`)
      .set('Cookie', user.cookie)
      .set('X-CSRF-Token', user.csrfToken)
      .send({ role: 'user' })
      .expect(403);

    const currentUser = await User.findOne({ username: normalUser.username });
    await api
      .patch(`/api/users/${String(currentUser?._id)}`)
      .set('Cookie', user.cookie)
      .set('X-CSRF-Token', user.csrfToken)
      .send({ role: 'moderator' })
      .expect(400);

    await api
      .patch(`/api/users/${nonExistingId()}`)
      .set('Cookie', moderator.cookie)
      .set('X-CSRF-Token', moderator.csrfToken)
      .send({ description: 'No existe' })
      .expect(404);
  });

  test('allows a moderator to update another user', async () => {
    const target = await User.findOne({ username: normalUser.username });

    await api
      .patch(`/api/users/${String(target?._id)}`)
      .set('Cookie', moderator.cookie)
      .set('X-CSRF-Token', moderator.csrfToken)
      .send({ description: 'Editado por moderación' })
      .expect(200);
  });
});

describe('DELETE /api/users/:id', () => {
  test('deletes the user and owned content', async () => {
    const target = await User.findOne({ username: normalUser.username });
    const meme = await Meme.create({
      title: 'Meme del usuario',
      imageUrl: 'https://example.com/user.jpg',
      author: target?._id,
    });
    await Comment.create({
      content: 'Comentario del usuario',
      author: target?._id,
      parentId: meme._id,
      parentType: 'Meme',
      memeId: meme._id,
    });

    await api
      .delete(`/api/users/${String(target?._id)}`)
      .set('Cookie', user.cookie)
      .set('X-CSRF-Token', user.csrfToken)
      .expect(204);

    assert.strictEqual(await User.findById(target?._id), null);
    assert.strictEqual(await Meme.findById(meme._id), null);
    assert.strictEqual(await Comment.countDocuments({ memeId: meme._id }), 0);
  });

  test('rejects unauthorized, invalid and missing users', async () => {
    const target = await User.findOne({ username: moderatorUser.username });

    await api
      .delete(`/api/users/${String(target?._id)}`)
      .set('Cookie', user.cookie)
      .set('X-CSRF-Token', user.csrfToken)
      .expect(403);

    await api
      .delete('/api/users/id-invalido')
      .set('Cookie', moderator.cookie)
      .set('X-CSRF-Token', moderator.csrfToken)
      .expect(400);

    await api
      .delete(`/api/users/${nonExistingId()}`)
      .set('Cookie', moderator.cookie)
      .set('X-CSRF-Token', moderator.csrfToken)
      .expect(404);
  });
});

describe('GET /api/users/:id', () => {
    test('devuelve el perfil público de un usuario', async () => {
        const user = await User.findOne({
            username: normalUser.username,
        });
        assert.ok(user);

        const response = await api
            .get(`/api/users/${user.id}`)
            .expect(200);

        assert.equal(response.body.id, user.id);
        assert.equal(response.body.username, normalUser.username);
        assert.equal(response.body.role, 'user');
    });

    test('no expone email ni contraseña', async () => {
        const user = await User.findOne({
            username: normalUser.username,
        });
        assert.ok(user);

        const response = await api
            .get(`/api/users/${user.id}`)
            .expect(200);

        assert.equal('email' in response.body, false);
        assert.equal('passwordHash' in response.body, false);
    });

    test('devuelve 400 con un ID inválido', async () => {
        await api.get('/api/users/id-invalido').expect(400);
    });

    test('devuelve 404 si el usuario no existe', async () => {
        await api
            .get(`/api/users/${nonExistingId()}`)
            .expect(404);
    });
});

describe('GET /api/users/:id/memes', () => {
    test('devuelve solamente los memes aprobados', async () => {
        const user = await User.findOne({
            username: normalUser.username,
        });
        assert.ok(user);

        await Meme.create([
            {
                title: 'Meme aprobado',
                imageUrl: 'https://example.com/aprobado.png',
                author: user._id,
                status: 'approved',
            },
            {
                title: 'Meme pendiente',
                imageUrl: 'https://example.com/pendiente.png',
                author: user._id,
                status: 'pending',
            },
            {
                title: 'Meme rechazado',
                imageUrl: 'https://example.com/rechazado.png',
                author: user._id,
                status: 'rejected',
            },
        ]);

        const response = await api
            .get(`/api/users/${user.id}/memes`)
            .expect(200);

        assert.equal(response.body.length, 1);
        assert.equal(response.body[0].title, 'Meme aprobado');
        assert.equal(response.body[0].status, 'approved');
    });

    test('devuelve 404 si el usuario no existe', async () => {
        await api
            .get(`/api/users/${nonExistingId()}/memes`)
            .expect(404);
    });

    test('el dueño puede ver todos los estados de sus memes', async () => {
        const user = await User.findOne({
            username: normalUser.username,
        });
        assert.ok(user);

        await Meme.create([
            {
                title: 'Meme aprobado',
                imageUrl: 'https://example.com/aprobado.png',
                author: user._id,
                status: 'approved',
            },
            {
                title: 'Meme pendiente',
                imageUrl: 'https://example.com/pendiente.png',
                author: user._id,
                status: 'pending',
            },
            {
                title: 'Meme rechazado',
                imageUrl: 'https://example.com/rechazado.png',
                author: user._id,
                status: 'rejected',
            },
        ]);

        const session = await login(normalUser);

        const response = await api
            .get(`/api/users/${user.id}/memes`)
            .set('Cookie', session.cookie)
            .set('X-CSRF-Token', session.csrfToken)
            .expect(200);

        assert.equal(response.body.length, 3);

        const statuses = response.body.map(
            (meme: { status: string }) => meme.status,
        );

        assert.deepEqual(
            statuses.sort(),
            ['approved', 'pending', 'rejected'].sort(),
        );
    });

    test('otro usuario solo puede ver memes aprobados', async () => {
        const owner = await User.findOne({
            username: normalUser.username,
        });
        assert.ok(owner);

        await Meme.create([
            {
                title: 'Meme aprobado',
                imageUrl: 'https://example.com/aprobado.png',
                author: owner._id,
                status: 'approved',
            },
            {
                title: 'Meme pendiente',
                imageUrl: 'https://example.com/pendiente.png',
                author: owner._id,
                status: 'pending',
            },
        ]);

        const session = await login(moderatorUser);

        // Se comprueba que el moderador sí pueda ver ambos estados.
        const response = await api
            .get(`/api/users/${owner.id}/memes`)
            .set('Cookie', session.cookie)
            .set('X-CSRF-Token', session.csrfToken)
            .expect(200);

        assert.equal(response.body.length, 2);
    });

});

describe('PATCH /api/users/me', () => {
    test('permite editar descripción y avatar', async () => {
        const session = await login(normalUser);

        const response = await api
            .patch('/api/users/me')
            .set('Cookie', session.cookie)
            .set('X-CSRF-Token', session.csrfToken)
            .send({
                description: 'Me gustan los momazos',
                avatarUrl: 'https://example.com/avatar.png',
            })
            .expect(200);

        assert.equal(
            response.body.description,
            'Me gustan los momazos',
        );
        assert.equal(
            response.body.avatarUrl,
            'https://example.com/avatar.png',
        );

        const saved = await User.findOne({
            username: normalUser.username,
        });

        assert.equal(saved?.description, 'Me gustan los momazos');
        assert.equal(
            saved?.avatarUrl,
            'https://example.com/avatar.png',
        );
    });

    test('rechaza cambios sin autenticación', async () => {
        await api
            .patch('/api/users/me')
            .send({ description: 'Sin sesión' })
            .expect(401);
    });

    test('rechaza una sesión sin token CSRF', async () => {
        const session = await login(normalUser);

        await api
            .patch('/api/users/me')
            .set('Cookie', session.cookie)
            .send({ description: 'Cambio no autorizado' })
            .expect(401);
    });

    test('no permite modificar el rol del usuario', async () => {
        const session = await login(normalUser);

        await api
            .patch('/api/users/me')
            .set('Cookie', session.cookie)
            .set('X-CSRF-Token', session.csrfToken)
            .send({ role: 'moderator' })
            .expect(400);

        const user = await User.findOne({
            username: normalUser.username,
        });

        assert.equal(user?.role, 'user');
    });

    test('no modifica el perfil de otro usuario', async () => {
        const session = await login(normalUser);

        const otherUserBefore = await User.findOne({
            username: moderatorUser.username,
        });
        assert.ok(otherUserBefore);

        await api
            .patch('/api/users/me')
            .set('Cookie', session.cookie)
            .set('X-CSRF-Token', session.csrfToken)
            .send({ description: 'Solo mi perfil' })
            .expect(200);

        const otherUserAfter = await User.findById(
            otherUserBefore._id,
        );

        assert.equal(
            otherUserAfter?.description,
            otherUserBefore.description,
        );
    });
});
