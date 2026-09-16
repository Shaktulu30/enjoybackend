import mongoose from 'mongoose';
import { config } from './env.js';

export const connectDB = async () => {
  if (!config.mongoUrl) {
    console.warn('MONGO_URL no definida: el servidor inicia sin conexión a MongoDB');
    return;
  }
  await mongoose.connect(config.mongoUrl);
  console.log('Conectado a MongoDB');
};
