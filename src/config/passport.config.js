import { randomUUID } from 'node:crypto';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as JwtStrategy } from 'passport-jwt';
import { config } from './env.js';
import { AUTH_COOKIE_NAME } from './cookie.js';
import { userRepository } from '../repositories/user.repository.js';
import { createHash, isValidPassword } from '../utils/hash.js';
import { JWT_ALGORITHM } from '../utils/jwt.js';
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

const localOptions = { usernameField: 'email', passwordField: 'password', passReqToCallback: true, session: false };

const failure = (message, statusCode) => ({ message, statusCode });

const hasRequiredFields = (data, fields) => fields.every((field) => isNonEmptyString(data?.[field]));

// Hash de relleno: se compara aunque el email no exista, para que el tiempo de respuesta no delate si el usuario existe.
const dummyHashPromise = createHash(randomUUID());

const registerStrategy = new LocalStrategy(localOptions, async (req, _email, _password, done) => {
  try {
    const data = req.body;
    if (!hasRequiredFields(data, REGISTER_REQUIRED_FIELDS)) {
      return done(null, false, failure('Faltan campos obligatorios', 400));
    }

    const email = normalizeEmail(data.email);
    if (!isValidEmail(email)) {
      return done(null, false, failure('Faltan campos obligatorios', 400));
    }

    const { password } = data;
    if (password.length < PASSWORD_MIN_LENGTH) {
      return done(null, false, failure(`La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres`, 400));
    }
    if (Buffer.byteLength(password) > PASSWORD_MAX_BYTES) {
      return done(null, false, failure(`La contraseña no puede superar los ${PASSWORD_MAX_BYTES} bytes`, 400));
    }

    if (await userRepository.getByEmail(email)) {
      return done(null, false, failure('El email ya está registrado', 409));
    }

    const user = await userRepository.create({
      first_name: data.first_name.trim(),
      last_name: data.last_name.trim(),
      email,
      password: await createHash(password),
    });
    return done(null, toPublicUser(user));
  } catch (error) {
    if (error.code === DUPLICATE_KEY_ERROR) {
      return done(null, false, failure('El email ya está registrado', 409));
    }
    return done(error);
  }
});

const loginStrategy = new LocalStrategy(localOptions, async (req, _email, _password, done) => {
  try {
    const data = req.body;
    if (!hasRequiredFields(data, LOGIN_REQUIRED_FIELDS)) {
      return done(null, false, failure('Faltan campos obligatorios', 400));
    }

    const user = await userRepository.getByEmailWithPassword(normalizeEmail(data.email));
    const passwordMatches = await isValidPassword(data.password, user?.password ?? (await dummyHashPromise));

    if (!user || !passwordMatches) {
      return done(null, false, failure('Credenciales inválidas', 401));
    }

    return done(null, { id: user._id.toString(), email: user.email, role: user.role });
  } catch (error) {
    return done(error);
  }
});

const cookieExtractor = (req) => req.cookies?.[AUTH_COOKIE_NAME] ?? null;

const currentStrategy = new JwtStrategy(
  {
    jwtFromRequest: cookieExtractor,
    secretOrKeyProvider: (_req, _token, done) => done(null, config.jwtSecret),
    algorithms: [JWT_ALGORITHM],
  },
  ({ id, email, role }, done) => done(null, { id, email, role }),
);

// Para sumar una estrategia externa (Google, GitHub, etc.) se crea en este archivo y se agrega a este objeto:
// app.js no necesita cambios.
const strategies = {
  register: registerStrategy,
  login: loginStrategy,
  current: currentStrategy,
};

export const initializePassport = () => {
  Object.entries(strategies).forEach(([name, strategy]) => passport.use(name, strategy));
};
