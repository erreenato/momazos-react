import { Schema, model, Document, Types, Model } from 'mongoose';

// 1. Interfaz de Propiedades / Datos
export interface IComment extends Document {
  content: string;
  author: Types.ObjectId;
  parentId: Types.ObjectId;
  parentType: 'Meme' | 'Comment';
  memeId: Types.ObjectId;
  likes: number;
  dislikes: number;
  score: number;
}

// 2. Interfaz de Métodos de Instancia
export interface ICommentMethods {
  calculateScore(): number;
  updateScore(): Promise<number>;
}

// 3. Tipo del Documento Completo (Datos + Métodos)
export type CommentDocument = IComment & ICommentMethods;

// 4. Tipo del Modelo
export type CommentModel = Model<IComment, {}, ICommentMethods>;

// 5. Esquema con Generics
const commentSchema = new Schema<IComment, CommentModel, ICommentMethods>({
  content: { type: String, required: true },
  author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  parentId: { type: Schema.Types.ObjectId, required: true },
  parentType: { type: String, enum: ['Meme', 'Comment'], required: true },
  memeId: { type: Schema.Types.ObjectId, ref: 'Meme', required: true },
  likes: { type: Number, default: 0 },
  dislikes: { type: Number, default: 0 },
  score: { type: Number, default: 0 },
}, { timestamps: true });

// 6. Asignación de Métodos con tipado explícito de 'this'
commentSchema.methods.calculateScore = function (this: CommentDocument): number {
  const baseComment = 1;
  const likesPoints = this.likes * 1;
  const dislikesPoints = this.dislikes * 1;

  return baseComment + likesPoints - dislikesPoints;
};

commentSchema.methods.updateScore = async function (this: CommentDocument): Promise<number> {
  const newScore = this.calculateScore();
  this.score = newScore;
  await this.save();
  return newScore;
};

// 7. Exportación del Modelo estrictamente tipado
export const Comment = model<IComment, CommentModel>('Comment', commentSchema);