import { sendError } from '../utils/response.js';

export const errorHandler = (err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return sendError(res, 'JSON inválido en el cuerpo de la petición', 400);
  }
  const statusCode = err.statusCode || 500;
  if (statusCode === 500) console.error(err);
  return sendError(res, statusCode === 500 ? 'Error interno del servidor' : err.message, statusCode);
};
