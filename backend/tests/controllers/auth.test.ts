import { after, before, beforeEach, describe, test } from 'node:test';
import assert from 'node:assert';
import jwt from 'jsonwebtoken';
import { User } from '../../src/models/User.js';
import {
  api,
  closeTestDb,
  connectTestDb,
  login,
  moderatorUser,
  normalUser,
  resetDb,
  usersInDb,
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

describe('POST /api/auth/register', () => {
  test('creation succeeds with a fresh username', async () => {
    const usersAtStart = await usersInDb();
    const newUser = { username: 'NuevoMomero', email: 'nuevo@test.cl', password: 'secreto789' };

    const result = await api
      .post('/api/auth/register')
      .send(newUser)
      .expect(201)
      .expect('Content-Type', /application\/json/);

    const usersAtEnd = await usersInDb();
    assert.strictEqual(usersAtEnd.length, usersAtStart.length + 1);
    assert(usersAtEnd.map((u) => u.username).includes(newUser.username));
    assert.strictEqual(result.body.username, newUser.username);
    assert.strictEqual(result.body.role, 'user');
  });

  test('stores a bcrypt hash and never returns email or passwordHash', async () => {
    const result = await api
      .post('/api/auth/register')
      .send({ username: 'NuevoMomero', email: 'nuevo@test.cl', password: 'secreto789' })
      .expect(201);

    assert(!('email' in result.body));
    assert(!('passwordHash' in result.body));
    const saved = await User.findOne({ username: 'NuevoMomero' });
    assert(saved?.passwordHash.startsWith('$2'));
    assert.notStrictEqual(saved?.passwordHash, 'secreto789');
  });

  test('starts a session: JWT in httpOnly cookie and CSRF token in header', async () => {
    const result = await api
      .post('/api/auth/register')
      .send({ username: 'NuevoMomero', email: 'nuevo@test.cl', password: 'secreto789' })
      .expect(201);

    const setCookie = result.headers['set-cookie'] as unknown as string[];
    assert.match(setCookie[0], /token=/);
    assert.match(setCookie[0], /HttpOnly/);
    assert.strictEqual(typeof result.headers['x-csrf-token'], 'string');
  });

  test('ignores a role sent in the body', async () => {
    const result = await api
      .post('/api/auth/register')
      .send({ username: 'Hacker', email: 'hacker@test.cl', password: 'secreto789', role: 'moderator' })
      .expect(201);

    assert.strictEqual(result.body.role, 'user');
  });

  test('fails with 409 if username already taken', async () => {
    const usersAtStart = await usersInDb();
    const result = await api
      .post('/api/auth/register')
      .send({ username: normalUser.username, email: 'otro@test.cl', password: 'secreto789' })
      .expect(409)
      .expect('Content-Type', /application\/json/);

    assert(result.body.error.includes('nombre de usuario'));
    assert.strictEqual((await usersInDb()).length, usersAtStart.length);
  });

  test('fails with 409 if email already taken', async () => {
    const result = await api
      .post('/api/auth/register')
      .send({ username: 'Otro', email: normalUser.email, password: 'secreto789' })
      .expect(409);

    assert(result.body.error.includes('email'));
  });

  test('fails with 400 if data is missing or invalid', async () => {
    await api.post('/api/auth/register').send({ username: 'X' }).expect(400);
    await api.post('/api/auth/register').send({ username: 'X', email: 'no-es-email', password: 'secreto789' }).expect(400);
    await api.post('/api/auth/register').send({ username: 'X', email: 'x@test.cl', password: '123' }).expect(400);
  });
});

describe('POST /api/auth/login', () => {
  describe('when login succeeds with valid credentials', () => {
    test('returns the public user data', async () => {
      const result = await api
        .post('/api/auth/login')
        .send({ email: normalUser.email, password: normalUser.password })
        .expect(200)
        .expect('Content-Type', /application\/json/);

      assert.strictEqual(result.body.username, normalUser.username);
      assert(!('passwordHash' in result.body));
    });

    test('sends the CSRF token in the X-CSRF-Token header', async () => {
      const result = await api
        .post('/api/auth/login')
        .send({ email: normalUser.email, password: normalUser.password });

      const csrfToken = result.headers['x-csrf-token'];
      assert(typeof csrfToken === 'string', 'Missing X-CSRF-Token header');
      assert(csrfToken.length > 10, 'CSRF token too short');
    });

    test('sends the JWT as a cookie containing the same CSRF token', async () => {
      const result = await api
        .post('/api/auth/login')
        .send({ email: normalUser.email, password: normalUser.password });

      const csrfToken = result.headers['x-csrf-token'];
      const setCookie = result.headers['set-cookie'] as unknown as string[];
      assert(Array.isArray(setCookie), 'Set-Cookie header missing');
      const jwtValue = setCookie[0].match(/token=([^;]+)/)?.[1];
      assert(jwtValue, 'JWT not found in cookie');

      const payload = jwt.verify(jwtValue, process.env.JWT_SECRET as string);
      assert(payload && typeof payload === 'object');
      assert.strictEqual(payload.csrf, csrfToken);
      assert.strictEqual(payload.role, 'user');
    });

    test('accepts the email in any case', async () => {
      await api
        .post('/api/auth/login')
        .send({ email: normalUser.email.toUpperCase(), password: normalUser.password })
        .expect(200);
    });
  });

  describe('when login fails', () => {
    test('returns 401 with a wrong password', async () => {
      await api.post('/api/auth/login').send({ email: normalUser.email, password: 'wrongpassword' }).expect(401);
    });

    test('returns 401 with the same message for an unknown email', async () => {
      const wrongPassword = await api.post('/api/auth/login').send({ email: normalUser.email, password: 'nope' });
      const unknownEmail = await api.post('/api/auth/login').send({ email: 'nadie@test.cl', password: 'nope' });

      assert.strictEqual(unknownEmail.status, 401);
      assert.strictEqual(unknownEmail.body.error, wrongPassword.body.error);
    });
  });
});

describe('GET /api/auth/me', () => {
  test('returns the session user', async () => {
    const session = await login({ email: moderatorUser.email, password: moderatorUser.password });

    const result = await api
      .get('/api/auth/me')
      .set('Cookie', session.cookie)
      .set('X-CSRF-Token', session.csrfToken)
      .expect(200);

    assert.strictEqual(result.body.username, moderatorUser.username);
    assert.strictEqual(result.body.role, 'moderator');
  });

  test('returns 401 without cookie', async () => {
    await api.get('/api/auth/me').expect(401);
  });

  test('returns 401 with an invalid token', async () => {
    await api.get('/api/auth/me').set('Cookie', 'token=invalido').expect(401);
  });

  test('returns 401 without the CSRF header', async () => {
    const session = await login({ email: normalUser.email, password: normalUser.password });
    await api.get('/api/auth/me').set('Cookie', session.cookie).expect(401);
  });

  test('returns 401 with an expired token', async () => {
    const user = await User.findOne({ username: normalUser.username });
    const expired = jwt.sign(
      { sub: String(user?._id), role: 'user', csrf: 'abc', exp: Math.floor(Date.now() / 1000) - 60 },
      process.env.JWT_SECRET as string,
    );
    await api.get('/api/auth/me').set('Cookie', `token=${expired}`).set('X-CSRF-Token', 'abc').expect(401);
  });
});

describe('POST /api/auth/logout', () => {
  test('clears the cookie', async () => {
    const session = await login({ email: normalUser.email, password: normalUser.password });

    const result = await api.post('/api/auth/logout').set('Cookie', session.cookie).expect(204);

    const setCookie = result.headers['set-cookie'] as unknown as string[];
    assert.match(setCookie[0], /token=;/);
    assert.match(setCookie[0], /Expires=Thu, 01 Jan 1970/);
  });
});
