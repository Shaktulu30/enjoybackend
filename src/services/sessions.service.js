import { randomUUID } from 'node:crypto';
import { userRepository } from '../repositories/user.repository.js';
import { toCurrentUser, toPublicUser, toSessionUser } from '../dto/user.dto.js';
import { MESSAGES } from '../constants/messages.js';
import { AppError } from '../utils/AppError.js';
import { createHash, isValidPassword } from '../utils/hash.js';
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
const DUPLICATE_EMAIL_MESSAGE = 'El email ya está registrado';

// Hash de relleno: se compara aunque el email no exista, para que el tiempo de respuesta no delate si el usuario existe.
const dummyHashPromise = createHash(randomUUID());

const hasRequiredFields = (data, fields) => fields.every((field) => isNonEmptyString(data?.[field]));

const parseRegisterData = (data) => {
  if (!hasRequiredFields(data, REGISTER_REQUIRED_FIELDS)) throw new AppError(MESSAGES.MISSING_FIELDS, 400);

  const email = normalizeEmail(data.email);
  if (!isValidEmail(email)) throw new AppError(MESSAGES.MISSING_FIELDS, 400);

  const { password } = data;
  if (password.length < PASSWORD_MIN_LENGTH) {
    throw new AppError(`La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres`, 400);
  }
  if (Buffer.byteLength(password) > PASSWORD_MAX_BYTES) {
    throw new AppError(`La contraseña no puede superar los ${PASSWORD_MAX_BYTES} bytes`, 400);
  }

  return { first_name: data.first_name.trim(), last_name: data.last_name.trim(), email, password };
};

// Registro público: el rol nunca se toma del body (el modelo asigna "user" por defecto).
export const registerUser = async (data) => {
  const { first_name, last_name, email, password } = parseRegisterData(data);

  if (await userRepository.findByEmail(email)) throw new AppError(DUPLICATE_EMAIL_MESSAGE, 409);

  try {
    const user = await userRepository.create({ first_name, last_name, email, password: await createHash(password) });
    return toPublicUser(user);
  } catch (error) {
    if (error.code === DUPLICATE_KEY_ERROR) throw new AppError(DUPLICATE_EMAIL_MESSAGE, 409);
    throw error;
  }
};

// Login: ante cualquier fallo responde el mismo mensaje, sin revelar si el email existe.
export const validateCredentials = async (data) => {
  if (!hasRequiredFields(data, LOGIN_REQUIRED_FIELDS)) throw new AppError(MESSAGES.MISSING_FIELDS, 400);

  const user = await userRepository.findByEmailWithPassword(normalizeEmail(data.email));
  const passwordMatches = await isValidPassword(data.password, user?.password ?? (await dummyHashPromise));
  if (!user || !passwordMatches) throw new AppError(MESSAGES.INVALID_CREDENTIALS, 401);

  return toSessionUser(user);
};

// Perfil del usuario autenticado: se relee de la base para que los datos y el rol estén siempre actualizados.
export const getCurrentUser = async (userId) => {
  const user = await userRepository.findById(userId);
  if (!user) throw new AppError(MESSAGES.UNAUTHENTICATED, 401);
  return toCurrentUser(user);
};
