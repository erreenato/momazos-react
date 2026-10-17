import { Schema, model, Document, Types } from 'mongoose';

export interface IComment extends Document {
  author: Types.ObjectId;
  content: string;
  parentId: Types.ObjectId;
  parentType: 'Meme' | 'Comment';
  likes: number;
  dislikes: number;
  score: number;
  createdAt: Date;
}

const commentSchema = new Schema<IComment>(
  {
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // Referencia al modelo User
    content: { type: String, required: true, trim: true }, // Contenido del comentario
    parentId: { type: Schema.Types.ObjectId, required: true, refPath: 'parentType' }, // Referencia al modelo Meme o Comment según parentType
    parentType: { type: String, required: true, enum: ['Meme', 'Comment'] }, // Tipo de padre: 'Meme' o 'Comment'
    likes: { type: Number, default: 0 }, // Número de likes del comentario
    dislikes: { type: Number, default: 0 }, // Número de dislikes del comentario
    score: { type: Number, default: 1 }, // <--- Parte en 1 por la base de participación B_comentario
  },
  { timestamps: true } // Agrega automáticamente los campos createdAt y updatedAt
);

export const Comment = model<IComment>('Comment', commentSchema);