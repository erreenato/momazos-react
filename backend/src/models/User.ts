import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
  username: string;
  email: string;
  passwordHash: string;
  role: 'user' | 'moderator';
  description?: string;
  score: number;
  avatarUrl?: string;
  createdAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, unique: true, trim: true }, // Nombre de usuario único y obligatorio
    email: { type: String, required: true, unique: true, lowercase: true, trim: true }, // Correo electrónico único, obligatorio y en minúsculas
    passwordHash: { type: String, required: true }, // Hash de la contraseña, obligatorio
    role: { type: String, enum: ['user', 'moderator'], default: 'user' }, // Rol del usuario, puede ser 'user' o 'moderator', por defecto
    description: { type: String, default: '' }, // Descripción del usuario, opcional
    score: { type: Number, default: 0 }, // Puntuación del usuario, por defecto 0
    avatarUrl: { type: String, default: '' }, // URL del avatar del usuario, opcional
  },
  { timestamps: true }
);

export const User = model<IUser>('User', userSchema);