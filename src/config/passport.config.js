import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as JwtStrategy } from 'passport-jwt';
import { config } from './env.js';
import { AUTH_COOKIE_NAME } from './cookie.js';
import { registerUser, validateCredentials } from '../services/sessions.service.js';
import { toSessionUser } from '../dto/user.dto.js';
import { JWT_ALGORITHM } from '../utils/jwt.js';

const localOptions = { usernameField: 'email', passwordField: 'password', passReqToCallback: true, session: false };

// Las estrategias adaptan Passport a la capa de servicios: la lógica (validación, bcrypt, unicidad) vive en
// sessions.service. Si el servicio lanza un AppError, llega al middleware centralizado de errores.
const fromService = (serviceFn) => async (req, _email, _password, done) => {
  try {
    return done(null, await serviceFn(req.body));
  } catch (error) {
    return done(error);
  }
};

const registerStrategy = new LocalStrategy(localOptions, fromService(registerUser));

const loginStrategy = new LocalStrategy(localOptions, fromService(validateCredentials));

const cookieExtractor = (req) => req.cookies?.[AUTH_COOKIE_NAME] ?? null;

const currentStrategy = new JwtStrategy(
  {
    jwtFromRequest: cookieExtractor,
    secretOrKeyProvider: (_req, _token, done) => done(null, config.jwtSecret),
    algorithms: [JWT_ALGORITHM],
  },
  (payload, done) => done(null, toSessionUser(payload)),
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
