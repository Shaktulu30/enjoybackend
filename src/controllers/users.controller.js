import * as usersService from '../services/users.service.js';
import { sendSuccess } from '../utils/response.js';

export const getUsers = async (req, res, next) => {
  try {
    const users = await usersService.getAllUsers();
    return sendSuccess(res, { payload: users });
  } catch (error) {
    return next(error);
  }
};

export const updateUserRole = async (req, res, next) => {
  try {
    const user = await usersService.updateUserRole(req.params.uid, req.body?.role, req.user.id);
    return sendSuccess(res, { payload: user });
  } catch (error) {
    return next(error);
  }
};
