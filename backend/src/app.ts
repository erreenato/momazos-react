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

// Subidas de archivos
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
    credentials: true,
    exposedHeaders: ['X-CSRF-Token'],
  })
);

// Ruta de health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Servidor Express corriendo correctamente' });
});

// Rutas de la API REST
app.use('/api/auth', authRoutes);
app.use('/api', moderationRoutes);
app.use('/api/memes', memeRoutes);
app.use('/api/users', userRoutes);
app.use('/api/comments', commentRoutes);

// Servir la interfaz compilada de React (frontend/dist)
const frontendDistPath = path.resolve(__dirname, '../../frontend/dist');
app.use(express.static(frontendDistPath));

// Redirigir cualquier ruta no-API al index.html del frontend (React Router)
app.get('/{*path}', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(frontendDistPath, 'index.html'));
});

// Manejo de errores
app.use(notFoundHandler);
app.use(errorHandler);

export default app;