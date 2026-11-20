
import { after, before, beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { Buffer } from 'node:buffer';

import { Meme } from '../../src/models/Meme.js';
import {
    api,
    closeTestDb,
    connectTestDb,
    login,
    normalUser,
    resetDb,
    type TestSession,
} from '../test_helper.js';

let user: TestSession;

const uploadsDirectory = path.resolve(process.cwd(), 'uploads');
const validPng = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lXcAAAAASUVORK5CYII=',
    'base64',
);

before(async () => {
    await connectTestDb();
});

beforeEach(async () => {
    await resetDb();
    user = await login({
        email: normalUser.email,
        password: normalUser.password,
    });
});

after(async () => {
    await closeTestDb();
});

describe('POST /api/memes', () => {
    test('no deja archivos huérfanos cuando el título es inválido', async () => {
        const filesBefore = new Set(await readdir(uploadsDirectory));

        const response = await api
            .post('/api/memes')
            .set('Cookie', user.cookie)
            .set('X-CSRF-Token', user.csrfToken)
            .field('title', '')
            .attach('image', validPng, {
                filename: 'prueba.png',
                contentType: 'image/png',
            })
            .expect(400);

        assert.equal(
            response.body.error,
            'Debes ingresar un título y una URL de imagen válidos.',
        );

        const filesAfter = await readdir(uploadsDirectory);
        const newFiles = filesAfter.filter(
            (filename) => !filesBefore.has(filename),
        );

        assert.deepEqual(newFiles, []);
        assert.equal(await Meme.countDocuments(), 0);
    });

    test('rechaza archivos falsos y elimina el archivo subido', async () => {
        const filesBefore = new Set(await readdir(uploadsDirectory));

        const response = await api
            .post('/api/memes')
            .set('Cookie', user.cookie)
            .set('X-CSRF-Token', user.csrfToken)
            .field('title', 'Meme de prueba')
            .attach('image', Buffer.from('esto no es una imagen'), {
                filename: 'imagen.png',
                contentType: 'image/png',
            })
            .expect(400);

        assert.equal(
            response.body.error,
            'El archivo no es una imagen JPG, PNG o WebP válida.',
        );

        const filesAfter = await readdir(uploadsDirectory);
        const newFiles = filesAfter.filter(
            (filename) => !filesBefore.has(filename),
        );

        assert.deepEqual(newFiles, []);
        assert.equal(await Meme.countDocuments(), 0);
    });
});
