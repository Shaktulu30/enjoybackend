import { sendError } from '../utils/response.js';

export const FORBIDDEN_MESSAGE = 'No tenés permisos para realizar esta acción';

// Recibe los roles permitidos (una entrada de PERMISSIONS) y los compara con req.user.role.
// Debe ir después de authenticate: sin usuario responde 401; con usuario sin el rol requerido, 403.
export const authorize = (allowedRoles) => (req, res, next) => {
  if (!req.user) return sendError(res, 'No autenticado', 401);
  if (!allowedRoles.includes(req.user.role)) return sendError(res, FORBIDDEN_MESSAGE, 403);
  return next();
};
