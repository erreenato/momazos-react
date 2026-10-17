import { Schema, model, Document } from 'mongoose';
import { Meme } from './Meme.js';
import { Comment } from './Comment.js';

// 1. Interfaz de los métodos de la instancia
export interface IUserMethods {
  calculateScore(): Promise<number>;
  updateScore(): Promise<number>;
}

// 2. Interfaz principal combinando propiedades y métodos
export interface IUser extends Document, IUserMethods {
  username: string;
  email: string;
  passwordHash: string;
  role: 'user' | 'moderator';
  description?: string;
  score: number;
  avatarUrl?: string;
  createdAt: Date;
}

// 3. Crear el esquema tipando los métodos en el 3er parámetro genérico
const userSchema = new Schema<IUser, {}, IUserMethods>(
  {
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['user', 'moderator'], default: 'user' },
    description: { type: String, default: '' },
    score: { type: Number, default: 0 },
    avatarUrl: { type: String, default: '' },
  },
  { timestamps: true }
);

// 4. Método para CALCULAR el puntaje total del usuario desde la BD
userSchema.methods.calculateScore = async function (this: IUser): Promise<number> {
  // A. Sumar score de todos los memes creados por este usuario
  const memeScoreResult = await Meme.aggregate([
    { $match: { author: this._id } },
    { $group: { _id: null, totalScore: { $sum: '$score' } } },
  ]);

  // B. Sumar score de todos los comentarios creados por este usuario
  const commentScoreResult = await Comment.aggregate([
    { $match: { author: this._id } },
    { $group: { _id: null, totalScore: { $sum: '$score' } } },
  ]);

  const memesScore = memeScoreResult.length > 0 ? memeScoreResult[0].totalScore : 0;
  const commentsScore = commentScoreResult.length > 0 ? commentScoreResult[0].totalScore : 0;

  return memesScore + commentsScore;
};

// 5. Método para ACTUALIZAR y GUARDAR el puntaje en MongoDB
userSchema.methods.updateScore = async function (this: IUser): Promise<number> {
  const newScore = await this.calculateScore();
  this.score = newScore;
  await this.save();
  return newScore;
};

export const User = model<IUser>('User', userSchema);