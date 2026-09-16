import { randomUUID } from 'node:crypto';
import { userRepository } from '../repositories/user.repository.js';
import { createHash, isValidPassword } from '../utils/hash.js';
import { generateToken } from '../utils/jwt.js';
import { AppError } from '../utils/AppError.js';
import { toPublicUser } from '../dto/user.dto.js';
import {
  isNonEmptyString,
  isValidEmail,
  normalizeEmail,
  PASSWORD_MIN_LENGTH,
  PASSWORD_MAX_BYTES,
} from '../utils/validators.js';

const REGISTER_REQUIRED_FIELDS = ['first_name', 'last_name', 'email', 'password'];
const LOGIN_REQUIRED_FIELDS = ['email', 'password'];
const DUPLICATE_KEY_ERROR = 11000;

// Hash de relleno: se compara aunque el email no exista, para que el tiempo de respuesta no delate si el usuario existe.
const dummyHashPromise = createHash(randomUUID());

const hasRequiredFields = (data, fields) => fields.every((field) => isNonEmptyString(data?.[field]));

const validateRegisterData = (data) => {
  if (!hasRequiredFields(data, REGISTER_REQUIRED_FIELDS)) {
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

export const login = async (data) => {
  if (!hasRequiredFields(data, LOGIN_REQUIRED_FIELDS)) {
    throw new AppError('Faltan campos obligatorios', 400);
  }

  const user = await userRepository.getByEmailWithPassword(normalizeEmail(data.email));
  const passwordMatches = await isValidPassword(data.password, user?.password ?? (await dummyHashPromise));

  if (!user || !passwordMatches) {
    throw new AppError('Credenciales inválidas', 401);
  }

  return generateToken({ id: user._id.toString(), email: user.email, role: user.role });
};
