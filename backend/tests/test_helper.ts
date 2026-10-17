import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import supertest from 'supertest';
import app from '../src/app.js';
import { Meme } from '../src/models/Meme.js';
import { User } from '../src/models/User.js';

dotenv.config({ quiet: true });
// Los tests no deben depender de tener un .env: si falta el secreto usamos uno de prueba.
process.env.JWT_SECRET ??= 'test-secret';

const TEST_MONGODB_URI = process.env.TEST_MONGODB_URI ?? 'mongodb://127.0.0.1:27017/momazos_test';

export const api = supertest(app);

export const connectTestDb = async (): Promise<void> => {
  await mongoose.connect(TEST_MONGODB_URI);
};

export const closeTestDb = async (): Promise<void> => {
  await mongoose.connection.close();
};

export const initialUsers = [
  { username: 'MemeLord99', email: 'memelord@test.cl', password: 'secreto123', role: 'user' as const },
  { username: 'AdminGatito', email: 'admin@test.cl', password: 'secreto456', role: 'moderator' as const },
];

export const normalUser = initialUsers[0];
export const moderatorUser = initialUsers[1];

/** Deja la base de datos solo con los usuarios iniciales (sin memes). */
export const resetDb = async (): Promise<void> => {
  await User.deleteMany({});
  await Meme.deleteMany({});
  for (const { password, ...data } of initialUsers) {
    const passwordHash = await bcrypt.hash(password, 10);
    await new User({ ...data, passwordHash }).save();
  }
};

export const usersInDb = async () => {
  const users = await User.find({});
  return users.map((u) => u.toJSON());
};

export interface TestSession {
  cookie: string;
  csrfToken: string;
}

/** Hace login y devuelve la cookie con el JWT y el token CSRF, listos para las siguientes requests. */
export const login = async (credentials: { email: string; password: string }): Promise<TestSession> => {
  const result = await api.post('/api/auth/login').send(credentials).expect(200);
  const setCookie = result.headers['set-cookie'] as unknown as string[];
  return {
    cookie: setCookie[0].split(';')[0],
    csrfToken: result.headers['x-csrf-token'],
  };
};

export const nonExistingId = (): string => new mongoose.Types.ObjectId().toString();
