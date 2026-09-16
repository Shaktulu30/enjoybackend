import app from './app.js';
import { config, validateEnv } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';

const start = async () => {
  try {
    validateEnv();
    await connectDB();
    const server = app.listen(config.port, () => {
      console.log(`Servidor escuchando en http://localhost:${config.port} (${config.nodeEnv})`);
    });

    const shutdown = () => {
      server.close(async () => {
        await disconnectDB();
        process.exit(0);
      });
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    console.error('No se pudo iniciar el servidor:', error.message);
    process.exit(1);
  }
};

start();
