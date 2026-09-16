import passport from 'passport';
import { MESSAGES } from '../constants/messages.js';
import { AppError } from '../utils/AppError.js';

// Ejecuta una estrategia de Passport sin sesiones y deja el usuario en req.user.
// Los errores de los servicios llegan como AppError; los fallos que genera Passport por su cuenta
// (faltan credenciales -> 400, token ausente o inválido -> 401) se convierten acá. Todo sigue al errorHandler.
export const passportCall = (strategy) => (req, res, next) => {
  passport.authenticate(strategy, { session: false }, (error, user, _info, status) => {
    if (error) return next(error);
    if (!user) {
      return next(status === 400 ? new AppError(MESSAGES.MISSING_FIELDS, 400) : new AppError(MESSAGES.UNAUTHENTICATED, 401));
    }
    req.user = user;
    return next();
  })(req, res, next);
};

// Lee el JWT de la cookie (estrategia "current"), lo valida y deja { id, email, role } en req.user. 401 si no hay sesión válida.
export const authenticate = passportCall('current');
