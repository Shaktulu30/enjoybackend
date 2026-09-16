import mongoose from 'mongoose';
import { config } from './env.js';

mongoose.connection.on('disconnected', () => console.warn('MongoDB desconectado'));
mongoose.connection.on('reconnected', () => console.log('MongoDB reconectado'));
mongoose.connection.on('error', (error) => console.error('Error de MongoDB:', error.message));

export const connectDB = async () => {
  await mongoose.connect(config.mongoUrl, { serverSelectionTimeoutMS: 10000 });
  const { host, name } = mongoose.connection;
  console.log(`Conectado a MongoDB (host: ${host}, base: ${name})`);
};

export const disconnectDB = () => mongoose.disconnect();
