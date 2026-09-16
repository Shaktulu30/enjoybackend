import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

const ALGORITHM = 'HS256';

export const generateToken = ({ id, email, role }) =>
  jwt.sign({ id, email, role }, config.jwtSecret, { algorithm: ALGORITHM, expiresIn: config.jwtExpiresIn });

export const verifyToken = (token) => jwt.verify(token, config.jwtSecret, { algorithms: [ALGORITHM] });
