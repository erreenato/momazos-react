import { Schema, model, Document, Types } from 'mongoose';

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

// 4. Implementación de los métodos (sin Math.max para permitir negativos)
memeSchema.methods.calculateScore = function (this: IMeme, totalComments: number = 0): number {

  const likesPonderation = 2; // Cada like suma 2 puntos
  const dislikesPonderation = 1.5;
  const commentsPonderation = 1; // Cada comentario suma 1 punto


  const baseApproved = this.status === 'approved' ? 10 : 0;
  const likesPoints =  this.status === 'approved' ? this.likes * likesPonderation : 0;
  const dislikesPoints =  this.status === 'approved' ? this.dislikes * dislikesPonderation : 0;
  const commentsPoints =  this.status === 'approved' ? totalComments * commentsPonderation : 0;

  return baseApproved + likesPoints - dislikesPoints + commentsPoints;
};

memeSchema.methods.updateScore = async function (this: IMeme, totalComments: number = 0): Promise<number> {
  const newScore = this.calculateScore(totalComments);
  this.score = newScore;
  await this.save();
  return newScore;
};

export const Meme = model<IMeme>('Meme', memeSchema);