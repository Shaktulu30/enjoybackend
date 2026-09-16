import { AUTH_COOKIE_NAME, authCookieOptions, clearAuthCookieOptions } from '../config/cookie.js';
import { toSessionUser } from '../dto/user.dto.js';
import { generateToken } from '../utils/jwt.js';
import { sendSuccess } from '../utils/response.js';

// req.user lo dejan las estrategias de Passport, que ya devuelven DTOs (sin password).
export const register = (req, res) => sendSuccess(res, { payload: req.user, statusCode: 201 });

export const login = (req, res) => {
  const token = generateToken(req.user);
  res.cookie(AUTH_COOKIE_NAME, token, authCookieOptions);
  return sendSuccess(res, { message: 'Login correcto' });
};

export const current = (req, res) => sendSuccess(res, { payload: toSessionUser(req.user) });

export const logout = (req, res) => {
  res.clearCookie(AUTH_COOKIE_NAME, clearAuthCookieOptions);
  return sendSuccess(res, { message: 'Sesión cerrada' });
};
