import { AUTH_COOKIE_NAME } from '../config/cookie.js';
import { verifyToken } from '../utils/jwt.js';
import { sendError } from '../utils/response.js';

export const authenticate = (req, res, next) => {
  const token = req.cookies?.[AUTH_COOKIE_NAME];
  if (!token) {
    return sendError(res, 'No autenticado', 401);
  }

  try {
    const { id, email, role } = verifyToken(token);
    req.user = { id, email, role };
    return next();
  } catch {
    return sendError(res, 'No autenticado', 401);
  }
};
