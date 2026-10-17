import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from '../config/db.js';
import { seedApprovedMemes } from './seeds/seedApprovedMemes.js';

const run = async (): Promise<void> => {
  await connectDB();

  // Capturar el argumento de la consola (npm run seed <tipo>)
  const seedType = process.argv[2] || 'approved';

  try {
    switch (seedType) {
      case 'approved':
        await seedApprovedMemes();
        break;
      
      // A futuro la Dupla 2 o 3 pueden sumar sus casos aquí:
      // case 'pending':
      //   await seedPendingMemes();
      //   break;

      default:
        console.error(`❌ Tipo de seed desconocido: "${seedType}". Usa: approved`);
        process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error corriendo el seed:', error);
    process.exit(1);
  }

  process.exit(0);
};

run();