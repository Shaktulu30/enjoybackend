import passport from 'passport';
import { sendError } from '../utils/response.js';

// Ejecuta una estrategia de Passport sin sesiones y traduce los fallos al formato de respuesta de la API.
// Los fallos de las estrategias propias traen { message, statusCode }; los que genera Passport por su cuenta
// (faltan credenciales -> 400, token ausente o inválido -> 401) se mapean acá.
export const passportCall = (strategy) => (req, res, next) => {
  passport.authenticate(strategy, { session: false }, (error, user, info, status) => {
    if (error) return next(error);
    if (!user) {
      if (info?.statusCode) return sendError(res, info.message, info.statusCode);
      if (status === 400) return sendError(res, 'Faltan campos obligatorios', 400);
      return sendError(res, 'No autenticado', 401);
    }
    req.user = user;
    return next();
  })(req, res, next);
};
