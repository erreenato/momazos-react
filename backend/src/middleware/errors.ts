import type { ErrorRequestHandler, NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import { MulterError } from 'multer';

export class HttpError extends Error {
  readonly statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.name = 'HttpError';
    this.statusCode = statusCode;
  }
}

interface MongoDuplicateError extends Error {
  code?: number;
  keyValue?: Record<string, unknown>;
}

const isMongoDuplicateError = (error: unknown): error is MongoDuplicateError =>
  error instanceof Error && 'code' in error && error.code === 11000;

const getErrorResponse = (error: unknown): { statusCode: number; message: string } => {
  if (error instanceof HttpError) {
    return { statusCode: error.statusCode, message: error.message };
  }

  if (error instanceof MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return { statusCode: 400, message: 'La imagen no puede superar los 5 MB.' };
    }
    return { statusCode: 400, message: 'Error al procesar el archivo enviado.' };
  }

  if (error instanceof mongoose.Error.ValidationError) {
    return { statusCode: 400, message: 'Los datos enviados no son válidos.' };
  }

  if (error instanceof mongoose.Error.CastError) {
    return { statusCode: 400, message: 'El identificador enviado no es válido.' };
  }

  if (isMongoDuplicateError(error)) {
    const fields = Object.keys(error.keyValue ?? {});
    const field = fields[0];
    const labels: Record<string, string> = {
      email: 'email',
      username: 'nombre de usuario',
    };
    return {
      statusCode: 409,
      message: field && labels[field] ? `Ese ${labels[field]} ya está registrado.` : 'El recurso ya existe.',
    };
  }

  if (error instanceof SyntaxError && 'status' in error && error.status === 400) {
    return { statusCode: 400, message: 'El cuerpo de la solicitud debe ser JSON válido.' };
  }

  return { statusCode: 500, message: 'Error interno del servidor.' };
};

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({ error: `La ruta ${req.method} ${req.originalUrl} no existe.` });
};

export const errorHandler: ErrorRequestHandler = (
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  const { statusCode, message } = getErrorResponse(error);

  if (statusCode >= 500) {
    console.error('Error no controlado:', error);
  }

  res.status(statusCode).json({ error: message });
};
