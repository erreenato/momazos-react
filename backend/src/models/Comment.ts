import { Schema, model, Document, Types } from 'mongoose';

// 1. Interfaz de los métodos de la instancia
export interface ICommentMethods {
  calculateScore(): number;
  updateScore(): Promise<number>;
}

// 2. Interfaz principal combinando propiedades y métodos
export interface IComment extends Document, ICommentMethods {
  author: Types.ObjectId;
  content: string;
  parentId: Types.ObjectId;
  parentType: 'Meme' | 'Comment';
  likes: number;
  dislikes: number;
  score: number;
  createdAt: Date;
}

// 3. Crear el esquema tipando los métodos en el 3er parámetro genérico
const commentSchema = new Schema<IComment, {}, ICommentMethods>(
  {
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, trim: true },
    parentId: { type: Schema.Types.ObjectId, required: true, refPath: 'parentType' },
    parentType: { type: String, required: true, enum: ['Meme', 'Comment'] },
    likes: { type: Number, default: 0 },
    dislikes: { type: Number, default: 0 },
    score: { type: Number, default: 1 }, // Inicia en 1 por la base de participación
  },
  { timestamps: true }
);

// 4. Método para CALCULAR el puntaje del comentario en memoria
commentSchema.methods.calculateScore = function (this: IComment): number {
  const baseComment = 1;
  const likesPoints = this.likes * 1;
  const dislikesPoints = this.dislikes * 1;

  return baseComment + likesPoints - dislikesPoints;
};

// 5. Método para ACTUALIZAR y GUARDAR el puntaje en MongoDB
commentSchema.methods.updateScore = async function (this: IComment): Promise<number> {
  const newScore = this.calculateScore();
  this.score = newScore;
  await this.save();
  return newScore;
};

export const Comment = model<IComment>('Comment', commentSchema);