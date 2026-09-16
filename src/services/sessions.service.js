import { userRepository } from '../repositories/user.repository.js';
import { createHash } from '../utils/hash.js';
import { AppError } from '../utils/AppError.js';
import { toPublicUser } from '../dto/user.dto.js';
import {
  isNonEmptyString,
  isValidEmail,
  normalizeEmail,
  PASSWORD_MIN_LENGTH,
  PASSWORD_MAX_BYTES,
} from '../utils/validators.js';

const REQUIRED_FIELDS = ['first_name', 'last_name', 'email', 'password'];
const DUPLICATE_KEY_ERROR = 11000;

const validateRegisterData = (data) => {
  if (!REQUIRED_FIELDS.every((field) => isNonEmptyString(data?.[field]))) {
    throw new AppError('Faltan campos obligatorios', 400);
  }

  const email = normalizeEmail(data.email);
  if (!isValidEmail(email)) {
    throw new AppError('Faltan campos obligatorios', 400);
  }

  const { password } = data;
  if (password.length < PASSWORD_MIN_LENGTH) {
    throw new AppError(`La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres`, 400);
  }
  if (Buffer.byteLength(password) > PASSWORD_MAX_BYTES) {
    throw new AppError(`La contraseña no puede superar los ${PASSWORD_MAX_BYTES} bytes`, 400);
  }

  return {
    first_name: data.first_name.trim(),
    last_name: data.last_name.trim(),
    email,
    password,
  };
};

export const register = async (data) => {
  const { first_name, last_name, email, password } = validateRegisterData(data);

  const existingUser = await userRepository.getByEmail(email);
  if (existingUser) {
    throw new AppError('El email ya está registrado', 409);
  }

  try {
    const user = await userRepository.create({
      first_name,
      last_name,
      email,
      password: await createHash(password),
    });
    return toPublicUser(user);
  } catch (error) {
    if (error.code === DUPLICATE_KEY_ERROR) {
      throw new AppError('El email ya está registrado', 409);
    }
    throw error;
  }
};
