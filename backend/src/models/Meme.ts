import { Schema, model, Document, Types } from 'mongoose';

export interface IMeme extends Document {
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

const memeSchema = new Schema<IMeme>(
  {
    title: { type: String, required: true, trim: true }, // Título del meme, obligatorio y sin espacios al inicio o final
    imageUrl: { type: String, required: true }, // URL de la imagen del meme, obligatorio
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // Referencia al modelo User, obligatorio
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'], 
      default: 'pending' 
    }, // Estado del meme, puede ser 'pending', 'approved' o 'rejected', por defecto es 'pending'
    likes: { type: Number, default: 0 }, // Número de likes del meme, por defecto 0
    dislikes: { type: Number, default: 0 }, // Número de dislikes del meme, por defecto 0
    score: { type: Number, default: 0 }, // Puntuación del meme, por defecto 0
    tags: [{ type: String, trim: true }], // Lista de etiquetas del meme, cada etiqueta es una cadena de texto sin espacios al inicio o final
  },
  { timestamps: true } // Agrega automáticamente los campos createdAt y updatedAt
);

export const Meme = model<IMeme>('Meme', memeSchema);