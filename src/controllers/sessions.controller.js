import { AUTH_COOKIE_NAME, authCookieOptions, clearAuthCookieOptions } from '../config/cookie.js';
import * as sessionsService from '../services/sessions.service.js';
import { generateToken } from '../utils/jwt.js';
import { sendSuccess } from '../utils/response.js';

// req.user lo dejan las estrategias de Passport, que ya devuelven DTOs (sin password).
export const register = (req, res) => sendSuccess(res, { payload: req.user, statusCode: 201 });

export const login = (req, res) => {
  const token = generateToken(req.user);
  res.cookie(AUTH_COOKIE_NAME, token, authCookieOptions);
  return sendSuccess(res, { message: 'Login correcto' });
};

export const current = async (req, res, next) => {
  try {
    return sendSuccess(res, { payload: await sessionsService.getCurrentUser(req.user.id) });
  } catch (error) {
    return next(error);
  }
};

export const logout = (req, res) => {
  res.clearCookie(AUTH_COOKIE_NAME, clearAuthCookieOptions);
  return sendSuccess(res, { message: 'Sesión cerrada' });
};
