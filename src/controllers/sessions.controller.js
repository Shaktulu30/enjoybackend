import * as sessionsService from '../services/sessions.service.js';
import { AUTH_COOKIE_NAME, authCookieOptions, clearAuthCookieOptions } from '../config/cookie.js';
import { sendSuccess } from '../utils/response.js';

export const register = async (req, res, next) => {
  try {
    const user = await sessionsService.register(req.body);
    return sendSuccess(res, { payload: user, statusCode: 201 });
  } catch (error) {
    return next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const token = await sessionsService.login(req.body);
    res.cookie(AUTH_COOKIE_NAME, token, authCookieOptions);
    return sendSuccess(res, { message: 'Login correcto' });
  } catch (error) {
    return next(error);
  }
};

export const current = (req, res) => sendSuccess(res, { payload: req.user });

export const logout = (req, res) => {
  res.clearCookie(AUTH_COOKIE_NAME, clearAuthCookieOptions);
  return sendSuccess(res, { message: 'Sesión cerrada' });
};
