import { MESSAGES } from '../constants/messages.js';
import { AppError } from '../utils/AppError.js';
import { sendError } from '../utils/response.js';

const DUPLICATE_KEY_ERROR = 11000;

// Traduce cualquier error a { status: "error", message } con el código HTTP correcto.
// Solo los errores no previstos terminan en 500 (y se registran sin exponer detalles al cliente).
export const errorHandler = (err, req, res, next) => {
  if (err instanceof AppError) return sendError(res, err.message, err.statusCode);
  if (err.type === 'entity.parse.failed') return sendError(res, 'JSON inválido en el cuerpo de la petición', 400);
  if (err.name === 'ValidationError' || err.name === 'CastError') return sendError(res, 'Datos inválidos', 400);
  if (err.code === DUPLICATE_KEY_ERROR) return sendError(res, 'El recurso ya existe', 409);
  if (err.statusCode >= 400 && err.statusCode < 500) return sendError(res, err.message, err.statusCode);

  console.error(err);
  return sendError(res, MESSAGES.INTERNAL_ERROR, 500);
};
