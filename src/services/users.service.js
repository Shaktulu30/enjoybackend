import { userRepository } from '../repositories/user.repository.js';
import { ROLE_VALUES } from '../config/roles.js';
import { toPublicUser } from '../dto/user.dto.js';
import { AppError } from '../utils/AppError.js';
import { isValidObjectId } from '../utils/validators.js';

export const getAllUsers = async () => {
  const users = await userRepository.getAll();
  return users.map(toPublicUser);
};

export const updateUserRole = async (userId, role, requesterId) => {
  if (!isValidObjectId(userId)) throw new AppError('ID de usuario inválido', 400);
  if (!ROLE_VALUES.includes(role)) {
    throw new AppError(`El rol debe ser uno de: ${ROLE_VALUES.join(', ')}`, 400);
  }
  if (userId === requesterId) throw new AppError('No podés modificar tu propio rol', 409);

  const user = await userRepository.updateRole(userId, role);
  if (!user) throw new AppError('Usuario no encontrado', 404);
  return toPublicUser(user);
};
