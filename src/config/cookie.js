import { config } from './env.js';

export const AUTH_COOKIE_NAME = 'currentUser';

const baseCookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: config.isProduction,
};

export const authCookieOptions = { ...baseCookieOptions, maxAge: 3600000 };

export const clearAuthCookieOptions = baseCookieOptions;
