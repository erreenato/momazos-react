import { Schema, model, Document, Types } from 'mongoose';
import { User } from './User.js';
import { Comment } from './Comment.js';

// 1. Interfaz de los métodos de la instancia
export interface IMemeMethods {
  calculateScore(totalComments?: number): number;
  updateScore(totalComments?: number): Promise<number>;
}

// 2. Interfaz principal combinando propiedades y métodos
export interface IMeme extends Document, IMemeMethods {
  title: string;
  imageUrl: string;
  author: Types.ObjectId;
  status: 'pending' | 'approved' | 'rejected';
  likes: number;
  dislikes: number;
  score: number;
  tags: string[];
  createdAt: Date;
}

// 3. Crear el esquema tipando los métodos en el 3er parámetro genérico
const memeSchema = new Schema<IMeme, {}, IMemeMethods>(
  {
    title: { type: String, required: true, trim: true },
    imageUrl: { type: String, required: true },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { 
      type: String, 
      enum: ['pending', 'approved', 'rejected'], 
      default: 'pending' 
    },
    likes: { type: Number, default: 0 },
    dislikes: { type: Number, default: 0 },
    score: { type: Number, default: 0 },
    tags: [{ type: String, trim: true }],
  },
  { timestamps: true }
);

memeSchema.methods.updateScore = async function(): Promise<number> {
  // 1. Puntos base por likes y dislikes del meme
  const baseScore = this.likes - this.dislikes;

  // 2. Traer todos los comentarios pertenecientes a este meme
  const comments = await Comment.find({ memeId: this._id });

  // 3. Aplicar ponderación
  let commentScore = 0;
  for (const comment of comments) {
    if (comment.parentType === 'Meme') {
      commentScore += 3; // Comentario directo
    } else {
      commentScore += 1; // Respuesta anidada
    }
  }

  // 4. Guardar puntaje del meme
  this.score = baseScore + commentScore;
  await this.save();

  // 5. Cascada: Actualizar el score del autor del meme
  const author = await User.findById(this.author);
  if (author && typeof author.updateScore === 'function') {
    await author.updateScore();
  }

  return this.score; // 👈 Retornamos el número para cumplir con Promise<number>
};

memeSchema.methods.updateScore = async function (this: IMeme, totalComments: number = 0): Promise<number> {
  const newScore = this.calculateScore(totalComments);
  this.score = newScore;
  await this.save();
  return newScore;
};

export const Meme = model<IMeme>('Meme', memeSchema);