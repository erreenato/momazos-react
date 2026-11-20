
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { api } from '../test_helper.js';

describe('Límites de solicitudes HTTP', () => {
    test('rechaza JSON demasiado grande con error 413', async () => {
        const response = await api
            .post('/api/auth/login')
            .send({
                email: 'test@example.com',
                password: 'a'.repeat(40_000),
            })
            .expect(413);

        assert.deepEqual(response.body, {
            error: 'El cuerpo de la solicitud es demasiado grande.',
        });
    });
});
