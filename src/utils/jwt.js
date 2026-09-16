import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

export const JWT_ALGORITHM = 'HS256';

export const generateToken = ({ id, email, role }) =>
  jwt.sign({ id, email, role }, config.jwtSecret, { algorithm: JWT_ALGORITHM, expiresIn: config.jwtExpiresIn });
