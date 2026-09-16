import dotenv from 'dotenv';

dotenv.config({ quiet: true });

const REQUIRED_VARS = ['MONGO_URL', 'JWT_SECRET'];

export const config = {
  port: Number(process.env.PORT) || 8080,
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  mongoUrl: process.env.MONGO_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
  bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS) || 10,
};

export const validateEnv = () => {
  const missing = REQUIRED_VARS.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    throw new Error(`Faltan variables de entorno obligatorias: ${missing.join(', ')}`);
  }
};
