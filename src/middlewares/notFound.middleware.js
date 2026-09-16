import { AppError } from '../utils/AppError.js';

export const notFound = (req, res, next) => next(new AppError(`Ruta ${req.method} ${req.originalUrl} no encontrada`, 404));
