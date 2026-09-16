import { sendError } from '../utils/response.js';

const notImplemented = (req, res) => sendError(res, 'Funcionalidad pendiente de implementación', 501);

export const register = notImplemented;
export const login = notImplemented;
export const current = notImplemented;
export const logout = notImplemented;
