import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from '../config/db.js';
import { seedDatabase } from './seeds/seedDatabase.js';

const run = async (): Promise<void> => {
  await connectDB();

  try {
    await seedDatabase();
  } catch (error) {
    console.error('❌ Error corriendo el seed:', error);
    process.exit(1);
  }

  process.exit(0);
};

run();
