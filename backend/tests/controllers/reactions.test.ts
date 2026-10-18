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
let authorId: string;

const createMeme = async (overrides: Record<string, unknown> = {}) =>
  Meme.create({
    title: 'Meme de prueba',
    imageUrl: 'https://example.com/meme.jpg',
    author: authorId,
    status: 'approved',
    ...overrides,
  });

const react = (memeId: string, type: string, session: TestSession) =>
  api
    .post(`/api/memes/${memeId}/react`)
    .set('Cookie', session.cookie)
    .set('X-CSRF-Token', session.csrfToken)
    .send({ type });

before(async () => {
  await connectTestDb();
});

beforeEach(async () => {
  await resetDb();
  // Los memes los crea otro usuario para que el votante no sea su propio autor.
  const author = await User.findOne({ username: moderatorUser.username });
  authorId = String(author?._id);
  user = await login({ email: normalUser.email, password: normalUser.password });
});

after(async () => {
  await closeTestDb();
});

describe('POST /api/memes/:id/react', () => {
  test('rejects anonymous reactions with 401', async () => {
    const meme = await createMeme();
    await api.post(`/api/memes/${String(meme._id)}/react`).send({ type: 'like' }).expect(401);
  });

  test('registers a single like even if requested many times', async () => {
    const meme = await createMeme();

    await react(String(meme._id), 'like', user).expect(200);
    await react(String(meme._id), 'like', user).expect(200);
    const result = await react(String(meme._id), 'like', user).expect(200);

    assert.strictEqual(result.body.meme.likes, 1);
    assert.strictEqual(result.body.meme.dislikes, 0);
    assert.strictEqual(result.body.meme.myReaction, 'like');
    assert.strictEqual((await Meme.findById(String(meme._id)))?.likes, 1);
  });

  test('switches a like to a dislike without leaving the old like behind', async () => {
    const meme = await createMeme();

    await react(String(meme._id), 'like', user).expect(200);
    const result = await react(String(meme._id), 'dislike', user).expect(200);

    assert.strictEqual(result.body.meme.likes, 0);
    assert.strictEqual(result.body.meme.dislikes, 1);
    assert.strictEqual(result.body.meme.myReaction, 'dislike');
  });

  test('keeps dislikes at one when requested many times', async () => {
    const meme = await createMeme();

    await react(String(meme._id), 'dislike', user).expect(200);
    const result = await react(String(meme._id), 'dislike', user).expect(200);

    assert.strictEqual(result.body.meme.dislikes, 1);
  });

  test('returns 400 for an invalid reaction type', async () => {
    const meme = await createMeme();
    await react(String(meme._id), 'love', user).expect(400);
  });

  test('returns 404 for a non existing meme', async () => {
    await react(nonExistingId(), 'like', user).expect(404);
  });
});

describe('GET /api/memes', () => {
  test('returns myReaction for the logged-in viewer', async () => {
    const meme = await createMeme();
    await react(String(meme._id), 'like', user).expect(200);

    const result = await api
      .get('/api/memes')
      .set('Cookie', user.cookie)
      .set('X-CSRF-Token', user.csrfToken)
      .expect(200);

    assert.strictEqual(result.body[0].myReaction, 'like');
    assert.strictEqual(result.body[0].likedBy, undefined);
  });

  test('returns myReaction null for anonymous visitors', async () => {
    await createMeme();

    const result = await api.get('/api/memes').expect(200);

    assert.strictEqual(result.body[0].myReaction, null);
  });
});

describe('GET /api/memes/anti-ranking', () => {
  test('orders memes from worst to best score', async () => {
    await createMeme({ title: 'Bueno', score: 30 });
    await createMeme({ title: 'Malo', score: -12 });
    await createMeme({ title: 'Regular', score: 4 });

    const result = await api.get('/api/memes/anti-ranking').expect(200);

    assert.deepStrictEqual(
      result.body.map((meme: { title: string }) => meme.title),
      ['Malo', 'Regular', 'Bueno'],
    );
  });
});

describe('POST /api/comments/:id/react', () => {
  test('rejects anonymous reactions with 401', async () => {
    const meme = await createMeme();
    const comment = await Comment.create({
      content: 'Hola',
      author: authorId,
      parentId: meme._id,
      parentType: 'Meme',
      memeId: meme._id,
    });

    await api.post(`/api/comments/${String(comment._id)}/react`).send({ type: 'like' }).expect(401);
  });

  test('registers a single like per user on a comment', async () => {
    const meme = await createMeme();
    const comment = await Comment.create({
      content: 'Hola',
      author: authorId,
      parentId: meme._id,
      parentType: 'Meme',
      memeId: meme._id,
    });

    const first = await api
      .post(`/api/comments/${String(comment._id)}/react`)
      .set('Cookie', user.cookie)
      .set('X-CSRF-Token', user.csrfToken)
      .send({ type: 'like' })
      .expect(200);
    const second = await api
      .post(`/api/comments/${String(comment._id)}/react`)
      .set('Cookie', user.cookie)
      .set('X-CSRF-Token', user.csrfToken)
      .send({ type: 'like' })
      .expect(200);

    assert.strictEqual(first.body.comment.likes, 1);
    assert.strictEqual(second.body.comment.likes, 1);
    assert.strictEqual(second.body.comment.myReaction, 'like');
  });
});
