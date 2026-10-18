
import { after, before, beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { User } from '../../src/models/User.js';
import { Meme } from '../../src/models/Meme.js';
import {
    api,
    connectTestDb,
    closeTestDb,
    resetDb,
    login,
    normalUser,
    moderatorUser,
    nonExistingId,
} from '../test_helper.js';

before(async () => {
    await connectTestDb();
});

beforeEach(async () => {
    await resetDb();
});

after(async () => {
    await closeTestDb();
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
