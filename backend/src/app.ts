import express, { Application } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.routes.js';
import moderationRoutes from './routes/moderation.routes.js';

const app: Application = express();

// Middlewares requeridos
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true, // Permitir envío de cookies httpOnly
  })
);

// Ruta de prueba
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Servidor Express corriendo correctamente' });
});

app.use('/api/auth', authRoutes);
app.use('/api', moderationRoutes);

export default app;