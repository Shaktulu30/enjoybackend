import mongoose from 'mongoose';
import { config } from './env.js';

export const connectDB = async () => {
  if (!config.mongoUrl) {
    throw new Error('La variable de entorno MONGO_URL es obligatoria');
  }
  await mongoose.connect(config.mongoUrl);
  console.log('Conectado a MongoDB');
};
