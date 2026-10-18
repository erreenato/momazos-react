/**
 * Pesos centralizados del sistema de puntaje. Están juntos y documentados para
 * que memes, comentarios y usuarios usen la misma escala y sea fácil de ajustar.
 *
 * Notas de diseño:
 * - Un dislike penaliza más de lo que premia un like, para desincentivar el spam.
 * - El aporte de los comentarios a un meme tiene rendimiento decreciente vía tope
 *   (`commentCap`): así un hilo gigante no lleva solo un meme al primer lugar.
 * - Los puntajes pueden ser negativos a propósito: son la base del anti-ranking.
 */
export const SCORING = {
  meme: {
    /** Bonus por estar aprobado por moderación. */
    approvedBonus: 10,
    /** Puntos por cada like recibido. */
    like: 3,
    /** Puntos (negativos) por cada dislike recibido. */
    dislike: -4,
    /** Puntos que aporta cada comentario de primer nivel hecho en el meme. */
    comment: 2,
    /** Puntos que aporta cada respuesta (comentario dentro de un comentario). */
    reply: 1,
    /** Tope del aporte total de comentarios, para evitar que un solo hilo domine. */
    commentCap: 30,
  },
  comment: {
    /** Puntos base por existir (participar ya suma). */
    base: 1,
    /** Puntos por cada like recibido en el comentario. */
    like: 2,
    /** Puntos (negativos) por cada dislike recibido en el comentario. */
    dislike: -2,
  },
} as const;

/** Suma de puntajes de comentarios limitada por el tope configurado. */
export const capCommentScore = (rawCommentScore: number): number =>
  Math.min(rawCommentScore, SCORING.meme.commentCap);
