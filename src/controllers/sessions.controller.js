import * as sessionsService from '../services/sessions.service.js';
import { sendSuccess, sendError } from '../utils/response.js';

const notImplemented = (req, res) => sendError(res, 'Funcionalidad pendiente de implementación', 501);

export const register = async (req, res, next) => {
  try {
    const user = await sessionsService.register(req.body);
    return sendSuccess(res, { payload: user, statusCode: 201 });
  } catch (error) {
    return next(error);
  }
};

export const login = notImplemented;
export const current = notImplemented;
export const logout = notImplemented;
