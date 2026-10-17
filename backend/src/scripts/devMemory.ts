import dotenv from 'dotenv';
dotenv.config();

/**
 * Arranque para desarrollo sin tener MongoDB instalado.
 * Levanta una MongoDB efímera en memoria, la puebla con el seed y expone la API
 * normal. Los datos se pierden al reiniciar (útil solo para probar la página).
 *
 *   npm run dev:memory
 */
const PORT = process.env.PORT || 4000;

const start = async (): Promise<void> => {
  const { MongoMemoryServer } = await import('mongodb-memory-server');

  console.log('🧪 Levantando MongoDB en memoria (la primera vez descarga el binario)...');
  const mongod = await MongoMemoryServer.create({ instance: { dbName: 'momazos_db' } });
  process.env.MONGO_URI = mongod.getUri('momazos_db');

  // Importamos app/db/seed recién ahora para que tomen el MONGO_URI de memoria.
  const { default: app } = await import('../app.js');
  const { connectDB } = await import('../config/db.js');
  const { seedDatabase } = await import('./seeds/seedDatabase.js');

  await connectDB();
  await seedDatabase();

  const server = app.listen(PORT, () => {
    console.log(`🚀 Backend (memoria) escuchando en http://localhost:${PORT}`);
    console.log('   Login de prueba: creator@memes.com / password123');
  });

  const shutdown = async (): Promise<void> => {
    server.close();
    await mongod.stop();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
};

start().catch((error) => {
  console.error('❌ No se pudo iniciar el backend en memoria:', error);
  process.exit(1);
});
