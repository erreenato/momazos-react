import { after, before, beforeEach, describe, test } from 'node:test';
import assert from 'node:assert';
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

const initialMemes = [
  { title: 'Cuando compila a la primera en TypeScript', imageUrl: 'https://example.com/1.jpg', status: 'approved' },
  { title: 'Esperando que el moderador apruebe mi momo', imageUrl: 'https://example.com/2.jpg' },
  { title: 'Otro momo pendiente', imageUrl: 'https://example.com/3.jpg' },
];

const pendingMemesInDb = async () => Meme.find({ status: 'pending' });

let moderator: TestSession;
let user: TestSession;

before(async () => {
  await connectTestDb();
});

beforeEach(async () => {
  await resetDb();
  const author = await User.findOne({ username: normalUser.username });
  await Meme.insertMany(initialMemes.map((meme) => ({ ...meme, author: author?._id })));

  moderator = await login({ email: moderatorUser.email, password: moderatorUser.password });
  user = await login({ email: normalUser.email, password: normalUser.password });
});

after(async () => {
  await closeTestDb();
});

describe('GET /api/moderation/memes', () => {
  test('returns the pending memes with their author to a moderator', async () => {
    const result = await api
      .get('/api/moderation/memes')
      .set('Cookie', moderator.cookie)
      .set('X-CSRF-Token', moderator.csrfToken)
      .expect(200)
      .expect('Content-Type', /application\/json/);

    assert.strictEqual(result.body.length, 2);
    assert(result.body.every((meme: { status: string }) => meme.status === 'pending'));
    assert.strictEqual(result.body[0].author.username, normalUser.username);
    assert.strictEqual(typeof result.body[0].id, 'string');
  });

  test('returns 403 to a normal user', async () => {
    await api
      .get('/api/moderation/memes')
      .set('Cookie', user.cookie)
      .set('X-CSRF-Token', user.csrfToken)
      .expect(403);
  });

  test('returns 401 without session', async () => {
    await api.get('/api/moderation/memes').expect(401);
  });
});

describe('PATCH /api/memes/:id/status', () => {
  const patchStatus = (id: string, status: unknown, session: TestSession) =>
    api
      .patch(`/api/memes/${id}/status`)
      .set('Cookie', session.cookie)
      .set('X-CSRF-Token', session.csrfToken)
      .send({ status });

  test('a moderator can approve a meme', async () => {
    const [meme] = await pendingMemesInDb();

    const result = await patchStatus(String(meme._id), 'approved', moderator).expect(200);

    assert.strictEqual(result.body.status, 'approved');
    assert.strictEqual((await Meme.findById(String(meme._id)))?.status, 'approved');
    assert.strictEqual((await pendingMemesInDb()).length, 1);
  });

  test('a moderator can reject a meme', async () => {
    const [meme] = await pendingMemesInDb();

    const result = await patchStatus(String(meme._id), 'rejected', moderator).expect(200);

    assert.strictEqual(result.body.status, 'rejected');
    assert.strictEqual((await Meme.findById(String(meme._id)))?.status, 'rejected');
  });

  test('returns 403 to a normal user and does not change the meme', async () => {
    const [meme] = await pendingMemesInDb();

    await patchStatus(String(meme._id), 'approved', user).expect(403);

    assert.strictEqual((await Meme.findById(String(meme._id)))?.status, 'pending');
  });

  test('returns 401 without the CSRF header', async () => {
    const [meme] = await pendingMemesInDb();

    await api
      .patch(`/api/memes/${String(meme._id)}/status`)
      .set('Cookie', moderator.cookie)
      .send({ status: 'approved' })
      .expect(401);

    assert.strictEqual((await Meme.findById(String(meme._id)))?.status, 'pending');
  });

  test('returns 401 with the CSRF token of another session', async () => {
    const [meme] = await pendingMemesInDb();

    await patchStatus(String(meme._id), 'approved', { cookie: moderator.cookie, csrfToken: user.csrfToken }).expect(401);
  });

  test('returns 400 with an invalid status', async () => {
    const [meme] = await pendingMemesInDb();
    await patchStatus(String(meme._id), 'borrado', moderator).expect(400);
  });

  test('returns 400 with a malformatted id', async () => {
    await patchStatus('id-invalido', 'approved', moderator).expect(400);
  });

  test('returns 404 if the meme does not exist', async () => {
    await patchStatus(nonExistingId(), 'approved', moderator).expect(404);
  });
});
