import { Schema, model, Document, Types } from 'mongoose';
import { User } from './User.js';
import { Comment } from './Comment.js';
import { SCORING, capCommentScore } from '../config/scoring.js';

// 1. Interfaz de los métodos de la instancia
export interface IMemeMethods {
  calculateScore(commentScore?: number): number;
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
  /** Usuarios que dieron like (uno como máximo por usuario). */
  likedBy: Types.ObjectId[];
  /** Usuarios que dieron dislike (uno como máximo por usuario). */
  dislikedBy: Types.ObjectId[];
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
    likedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    dislikedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    score: { type: Number, default: 0 },
    tags: [{ type: String, trim: true }],
  },
  { timestamps: true }
);

// Recalcula el score a partir de todas sus fuentes, sin depender del valor previo.
memeSchema.methods.calculateScore = function (this: IMeme, commentScore: number = 0): number {
  const { approvedBonus, like, dislike } = SCORING.meme;
  const approvedBase = this.status === 'approved' ? approvedBonus : 0;
  const likesScore = this.likes * like;
  const dislikesScore = this.dislikes * dislike;
  return approvedBase + likesScore + dislikesScore + capCommentScore(commentScore);
};

memeSchema.methods.updateScore = async function (this: IMeme): Promise<number> {
  const comments = await Comment.find({ memeId: this._id });
  const commentScore = comments.reduce(
    (total, comment) =>
      total + (comment.parentType === 'Meme' ? SCORING.meme.comment : SCORING.meme.reply),
    0,
  );

  this.score = this.calculateScore(commentScore);
  await this.save();

  const author = await User.findById(this.author);
  if (author && typeof author.updateScore === 'function') {
    await author.updateScore();
  }

  return this.score;
};

export const Meme = model<IMeme>('Meme', memeSchema);
