import { sendError } from '../utils/response.js';

export const notFound = (req, res) => sendError(res, `Ruta ${req.method} ${req.originalUrl} no encontrada`, 404);
