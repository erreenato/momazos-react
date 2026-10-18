import bcrypt from 'bcryptjs';
import { Types } from 'mongoose';
import { Comment } from '../../models/Comment.js';
import { Meme } from '../../models/Meme.js';
import { User } from '../../models/User.js';

/** Contraseña compartida por todos los usuarios de prueba (para poder iniciar sesión). */
const DEMO_PASSWORD = 'password123';

const AVATARS = [
  'https://api.dicebear.com/7.x/bottts/svg?seed=momo1',
  'https://api.dicebear.com/7.x/bottts/svg?seed=momo2',
  'https://api.dicebear.com/7.x/bottts/svg?seed=momo3',
];

const USER_SEEDS = [
  { username: 'meme_creator', email: 'creator@memes.com', description: 'Fábrica oficial de momazos.' },
  { username: 'doge_lover', email: 'doge@memes.com', description: 'Solo subo momos de perros.' },
  { username: 'lagarto_verde', email: 'lagarto@memes.com', description: 'Programador de día, shitposter de noche.' },
  { username: 'patata_frita', email: 'patata@memes.com', description: 'Amante del caos y las patatas.' },
  { username: 'el_troll', email: 'troll@memes.com', description: 'Comentarios polémicos a domicilio.' },
  { username: 'AdminGatito', email: 'admin@memes.com', description: 'Moderador oficial del sitio.', role: 'moderator' as const },
];

interface MemeSeed {
  title: string;
  tags: string[];
  status: 'approved' | 'pending' | 'rejected';
  /** Índices de usuarios que dan like (sobre USER_SEEDS). */
  likes: number[];
  /** Índices de usuarios que dan dislike. */
  dislikes: number[];
}

const MEME_SEEDS: MemeSeed[] = [
  { title: 'Cuando compila a la primera', tags: ['programacion', 'react'], status: 'approved', likes: [0, 1, 2, 3], dislikes: [] },
  { title: 'Viernes de deploy a producción', tags: ['backend', 'express'], status: 'approved', likes: [0, 2], dislikes: [4] },
  { title: 'Yo explicando mi código en la daily', tags: ['daily', 'scrum'], status: 'approved', likes: [1, 2, 3], dislikes: [] },
  { title: 'El bug que solo pasa en producción', tags: ['bugs'], status: 'approved', likes: [0], dislikes: [3, 4] },
  { title: 'Mi CV después de un bootcamp de 2 semanas', tags: ['trabajo'], status: 'approved', likes: [], dislikes: [1, 2, 3, 4] },
  { title: 'Instalando 30 dependencias para un hola mundo', tags: ['node'], status: 'approved', likes: [2, 4], dislikes: [0] },
  { title: 'Cuando el profe dice "es tarea para la casa"', tags: ['universidad'], status: 'approved', likes: [1, 3], dislikes: [4] },
  { title: 'Error 500 pero en mi examen', tags: ['universidad', 'bugs'], status: 'approved', likes: [0, 1], dislikes: [2, 3, 4] },
  { title: 'Reunión que pudo haber sido un correo', tags: ['oficina'], status: 'approved', likes: [3], dislikes: [0, 4] },
  { title: 'GPS diciendo "recalculando"', tags: ['cotidiano'], status: 'approved', likes: [1, 2], dislikes: [] },
  { title: 'La función que escribí hace 6 meses', tags: ['legacy'], status: 'approved', likes: [0, 2, 4], dislikes: [] },
  { title: 'Docker funcionando por fin', tags: ['docker'], status: 'approved', likes: [1], dislikes: [0, 3] },
  { title: 'Pensé que era un bug y era un feature', tags: ['bugs'], status: 'approved', likes: [4], dislikes: [1, 2] },
  { title: 'Esperando que el moderador apruebe mi momo', tags: ['meta'], status: 'pending', likes: [], dislikes: [] },
  { title: 'Momazo recién salido del horno', tags: ['meta'], status: 'pending', likes: [], dislikes: [] },
  { title: 'Propuesta para el logo nuevo', tags: ['meta'], status: 'pending', likes: [], dislikes: [] },
  { title: 'Repost del repost del repost', tags: ['spam'], status: 'rejected', likes: [], dislikes: [] },
  { title: 'Contenido no relacionado con la página', tags: ['spam'], status: 'rejected', likes: [], dislikes: [] },
];

const COMMENT_SEEDS: { meme: number; author: number; content: string; likes: number[] }[] = [
  { meme: 0, author: 1, content: '¡Imposible, algo tuvo que quedar mal!', likes: [0, 2] },
  { meme: 0, author: 2, content: 'Confía en el poder del tipado estricto.', likes: [1] },
  { meme: 1, author: 0, content: 'Se fue derecho a producción y volvió con ganas.', likes: [2, 3] },
  { meme: 3, author: 4, content: 'Nunca falla en local, es ley de vida.', likes: [] },
  { meme: 5, author: 0, content: 'Y aún así pesa 900 MB.', likes: [2] },
  { meme: 7, author: 1, content: 'Ese dolor es real.', likes: [0] },
  { meme: 11, author: 3, content: 'Hasta que reinicias el computador.', likes: [2, 4] },
];

const pickUsers = (users: Types.ObjectId[], indexes: number[]): Types.ObjectId[] =>
  indexes.filter((index) => index < users.length).map((index) => users[index]);


export const seedDatabase = async (): Promise<void> => {
  console.log('🌱 Agregando datos de demostración sin borrar datos existentes...');

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  // Crear solamente los usuarios de demo que no existan.
  const users = [];

  for (const [index, seed] of USER_SEEDS.entries()) {
    let user = await User.findOne({ email: seed.email });

    if (!user) {
      user = await User.create({
        ...seed,
        passwordHash,
        avatarUrl: AVATARS[index % AVATARS.length],
      });

      console.log(`👤 Usuario creado: ${seed.username}`);
    } else {
      console.log(`↪️ Usuario existente: ${seed.username}`);
    }

    users.push(user);
  }

  const userIds = users.map((user) => user._id as Types.ObjectId);

  // Crear memes de demo sin duplicar los existentes.
  const memes = [];

  for (const [index, seed] of MEME_SEEDS.entries()) {
    const author = userIds[index % userIds.length];

    let meme = await Meme.findOne({
      title: seed.title,
      author,
    });

    if (!meme) {
      const likedBy = pickUsers(userIds, seed.likes);
      const dislikedBy = pickUsers(userIds, seed.dislikes);

      meme = await Meme.create({
        title: seed.title,
        imageUrl: `https://picsum.photos/seed/momo${index}/640/480`,
        author,
        status: seed.status,
        tags: seed.tags,
        likedBy,
        dislikedBy,
        likes: likedBy.length,
        dislikes: dislikedBy.length,
      });

      console.log(`🖼️ Meme creado: ${seed.title}`);
    }

    memes.push(meme);
  }

  // Crear comentarios solamente cuando no existan.
  for (const seed of COMMENT_SEEDS) {
    const meme = memes[seed.meme];
    const author = userIds[seed.author];

    if (!meme || !author) continue;

    const existingComment = await Comment.findOne({
      memeId: meme._id,
      author,
      content: seed.content,
    });

    if (existingComment) continue;

    const likedBy = pickUsers(userIds, seed.likes);

    const comment = await Comment.create({
      content: seed.content,
      author,
      parentId: meme._id,
      parentType: 'Meme',
      memeId: meme._id,
      likedBy,
      likes: likedBy.length,
      dislikes: 0,
    });

    await comment.updateScore();
  }

  // Recalcular puntajes.
  console.log('🧮 Actualizando puntajes de demostración...');

  for (const meme of memes) {
    await meme.updateScore();
  }

  for (const user of users) {
    await user.updateScore();
  }

  console.log('✅ Datos de demostración preparados.');
  console.log(`   Usuarios de demo: ${users.length}`);
  console.log(`   Memes de demo: ${memes.length}`);
  console.log('   Contraseña de usuarios nuevos: password123');
  console.log('   Moderador de demo: admin@memes.com');
};
