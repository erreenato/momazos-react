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
  moderator = await login({ email: moderatorUser.email, password: moderatorUser.password });
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

describe('GET /api/memes/:id', () => {
  test('returns an approved meme with its public author', async () => {
    const meme = await createMeme();

    const result = await api.get(`/api/memes/${String(meme._id)}`).expect(200);

    assert.strictEqual(result.body._id, String(meme._id));
    assert.strictEqual(result.body.author.username, moderatorUser.username);
    assert.strictEqual(result.body.likedBy, undefined);
  });

  test('returns 404 for an invalid or non-existing meme visibility', async () => {
    const pending = await createMeme({ status: 'pending' });

    await api.get(`/api/memes/${String(pending._id)}`).expect(404);
    await api.get('/api/memes/id-invalido').expect(400);
    await api.get(`/api/memes/${nonExistingId()}`).expect(404);
  });

  test('allows the owner or moderator to see an unapproved meme', async () => {
    const pending = await createMeme({ status: 'pending' });

    await api
      .get(`/api/memes/${String(pending._id)}`)
      .set('Cookie', moderator.cookie)
      .set('X-CSRF-Token', moderator.csrfToken)
      .expect(200);
  });
});

describe('PATCH /api/memes/:id', () => {
  test('updates editable fields for the author', async () => {
    const meme = await Meme.create({
      title: 'Original',
      imageUrl: 'https://example.com/original.jpg',
      author: await User.findOne({ username: normalUser.username }).then((user) => user?._id),
      status: 'approved',
    });

    const result = await api
      .patch(`/api/memes/${String(meme._id)}`)
      .set('Cookie', user.cookie)
      .set('X-CSRF-Token', user.csrfToken)
      .send({
        title: 'Actualizado',
        imageUrl: 'https://example.com/updated.jpg',
        tags: ['humor', 'typescript'],
      })
      .expect(200);

    assert.strictEqual(result.body.title, 'Actualizado');
    assert.deepStrictEqual(result.body.tags, ['humor', 'typescript']);
    assert.strictEqual((await Meme.findById(meme._id))?.title, 'Actualizado');
  });

  test('rejects invalid fields and unauthorized users', async () => {
    const meme = await createMeme();

    await api
      .patch(`/api/memes/${String(meme._id)}`)
      .set('Cookie', user.cookie)
      .set('X-CSRF-Token', user.csrfToken)
      .send({ score: 999 })
      .expect(400);

    await api
      .patch(`/api/memes/${String(meme._id)}`)
      .set('Cookie', user.cookie)
      .set('X-CSRF-Token', user.csrfToken)
      .send({ title: 'No autorizado' })
      .expect(403);
  });

  test('returns 400 or 404 for invalid or non-existing ids', async () => {
    await api
      .patch('/api/memes/id-invalido')
      .set('Cookie', user.cookie)
      .set('X-CSRF-Token', user.csrfToken)
      .send({ title: 'Meme' })
      .expect(400);

    await api
      .patch(`/api/memes/${nonExistingId()}`)
      .set('Cookie', user.cookie)
      .set('X-CSRF-Token', user.csrfToken)
      .send({ title: 'Meme' })
      .expect(404);
  });
});

describe('DELETE /api/memes/:id', () => {
  test('deletes the meme and its comments for the author', async () => {
    const meme = await Meme.create({
      title: 'Para borrar',
      imageUrl: 'https://example.com/delete.jpg',
      author: await User.findOne({ username: normalUser.username }).then((user) => user?._id),
      status: 'approved',
    });
    await Comment.create({
      content: 'Comentario asociado',
      author: authorId,
      parentId: meme._id,
      parentType: 'Meme',
      memeId: meme._id,
    });

    await api
      .delete(`/api/memes/${String(meme._id)}`)
      .set('Cookie', user.cookie)
      .set('X-CSRF-Token', user.csrfToken)
      .expect(204);

    assert.strictEqual(await Meme.findById(meme._id), null);
    assert.strictEqual(await Comment.countDocuments({ memeId: meme._id }), 0);
  });

  test('returns 403 for another user and 404 for a missing meme', async () => {
    const meme = await createMeme();

    await api
      .delete(`/api/memes/${String(meme._id)}`)
      .set('Cookie', user.cookie)
      .set('X-CSRF-Token', user.csrfToken)
      .expect(403);

    await api
      .delete(`/api/memes/${nonExistingId()}`)
      .set('Cookie', user.cookie)
      .set('X-CSRF-Token', user.csrfToken)
      .expect(404);
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
