import { after, before, beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
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

const createMeme = async (status: 'approved' | 'pending' = 'approved') => {
  const author = await User.findOne({ username: normalUser.username });
  return Meme.create({
    title: 'Meme de comentarios',
    imageUrl: 'https://example.com/comments.jpg',
    author: author?._id,
    status,
  });
};

const createComment = async (memeId: string, authorUsername = normalUser.username) => {
  const author = await User.findOne({ username: authorUsername });
  return Comment.create({
    content: 'Comentario original',
    author: author?._id,
    parentId: memeId,
    parentType: 'Meme',
    memeId,
  });
};

describe('GET /api/comments', () => {
  test('lists comments from approved memes without exposing voters', async () => {
    const meme = await createMeme();
    const comment = await createComment(String(meme._id));

    const result = await api.get('/api/comments').expect(200);

    assert.equal(result.body.length, 1);
    assert.equal(result.body[0]._id, String(comment._id));
    assert.equal(result.body[0].likedBy, undefined);
    assert.equal(result.body[0].dislikedBy, undefined);
  });

  test('does not list comments from unapproved memes', async () => {
    const meme = await createMeme('pending');
    await createComment(String(meme._id));

    const result = await api.get('/api/comments').expect(200);

    assert.equal(result.body.length, 0);
  });
});

describe('GET /api/comments/:id', () => {
  test('returns a comment from an approved meme', async () => {
    const meme = await createMeme();
    const comment = await createComment(String(meme._id));

    const result = await api.get(`/api/comments/${String(comment._id)}`).expect(200);

    assert.equal(result.body.content, 'Comentario original');
    assert.equal(result.body.author.username, normalUser.username);
  });

  test('returns 400 for an invalid id and 404 for a hidden or missing comment', async () => {
    await api.get('/api/comments/id-invalido').expect(400);
    await api.get(`/api/comments/${nonExistingId()}`).expect(404);

    const meme = await createMeme('pending');
    const comment = await createComment(String(meme._id));
    await api.get(`/api/comments/${String(comment._id)}`).expect(404);
  });

  test('allows the meme owner or moderator to see a hidden comment', async () => {
    const meme = await createMeme('pending');
    const comment = await createComment(String(meme._id));

    await api
      .get(`/api/comments/${String(comment._id)}`)
      .set('Cookie', user.cookie)
      .set('X-CSRF-Token', user.csrfToken)
      .expect(200);

    await api
      .get(`/api/comments/${String(comment._id)}`)
      .set('Cookie', moderator.cookie)
      .set('X-CSRF-Token', moderator.csrfToken)
      .expect(200);
  });
});

describe('PATCH /api/comments/:id', () => {
  test('allows the author to update only the content', async () => {
    const meme = await createMeme();
    const comment = await createComment(String(meme._id));

    const result = await api
      .patch(`/api/comments/${String(comment._id)}`)
      .set('Cookie', user.cookie)
      .set('X-CSRF-Token', user.csrfToken)
      .send({ content: 'Comentario editado' })
      .expect(200);

    assert.equal(result.body.content, 'Comentario editado');
    assert.equal((await Comment.findById(comment._id))?.content, 'Comentario editado');
  });

  test('rejects invalid fields and users without permissions', async () => {
    const meme = await createMeme();
    const comment = await createComment(String(meme._id), moderatorUser.username);

    await api
      .patch(`/api/comments/${String(comment._id)}`)
      .set('Cookie', user.cookie)
      .set('X-CSRF-Token', user.csrfToken)
      .send({ content: 'No autorizado' })
      .expect(403);

    const ownComment = await createComment(String(meme._id));
    await api
      .patch(`/api/comments/${String(ownComment._id)}`)
      .set('Cookie', user.cookie)
      .set('X-CSRF-Token', user.csrfToken)
      .send({ likes: 100 })
      .expect(400);

    await api
      .patch('/api/comments/id-invalido')
      .set('Cookie', user.cookie)
      .set('X-CSRF-Token', user.csrfToken)
      .send({ content: 'Comentario' })
      .expect(400);
  });
});

describe('DELETE /api/comments/:id', () => {
  test('deletes the comment and all replies for its author', async () => {
    const meme = await createMeme();
    const comment = await createComment(String(meme._id));
    const reply = await Comment.create({
      content: 'Respuesta',
      author: (await User.findOne({ username: moderatorUser.username }))?._id,
      parentId: comment._id,
      parentType: 'Comment',
      memeId: meme._id,
    });

    await api
      .delete(`/api/comments/${String(comment._id)}`)
      .set('Cookie', user.cookie)
      .set('X-CSRF-Token', user.csrfToken)
      .expect(204);

    assert.equal(await Comment.findById(comment._id), null);
    assert.equal(await Comment.findById(reply._id), null);
  });

  test('allows a moderator to delete another user comment and returns consistent errors', async () => {
    const meme = await createMeme();
    const comment = await createComment(String(meme._id));

    await api
      .delete(`/api/comments/${String(comment._id)}`)
      .set('Cookie', moderator.cookie)
      .set('X-CSRF-Token', moderator.csrfToken)
      .expect(204);

    await api
      .delete('/api/comments/id-invalido')
      .set('Cookie', moderator.cookie)
      .set('X-CSRF-Token', moderator.csrfToken)
      .expect(400);

    await api
      .delete(`/api/comments/${nonExistingId()}`)
      .set('Cookie', moderator.cookie)
      .set('X-CSRF-Token', moderator.csrfToken)
      .expect(404);
  });
});
