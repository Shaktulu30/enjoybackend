import { MESSAGES } from '../constants/messages.js';
import { AppError } from '../utils/AppError.js';

// Recibe los roles permitidos (una entrada de PERMISSIONS) y los compara con req.user.role.
// Debe ir después de authenticate: sin usuario responde 401; con usuario sin el rol requerido, 403.
export const authorize = (allowedRoles) => (req, res, next) => {
  if (!req.user) return next(new AppError(MESSAGES.UNAUTHENTICATED, 401));
  if (!allowedRoles.includes(req.user.role)) return next(new AppError(MESSAGES.FORBIDDEN, 403));
  return next();
};
