import express, { Application } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.routes.js';
import moderationRoutes from './routes/moderation.routes.js';
import memeRoutes from './routes/meme.routes.js';
import userRoutes from './routes/user.routes.js';
import commentRoutes from './routes/comment.routes.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { errorHandler, notFoundHandler } from './middleware/errors.js';

const app: Application = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(
  '/uploads',
  express.static(path.resolve(__dirname, '../uploads'))
);
// Middlewares requeridos
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true, // Permitir envío de cookies httpOnly
    exposedHeaders: ['X-CSRF-Token'], // Permitir que el frontend lea el token CSRF del login
  })
);

// Ruta de prueba
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Servidor Express corriendo correctamente' });
});

app.use('/api/auth', authRoutes);
app.use('/api', moderationRoutes);
app.use('/api/memes', memeRoutes);
app.use('/api/users', userRoutes);
app.use('/api/comments', commentRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;