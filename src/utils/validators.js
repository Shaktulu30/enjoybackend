import mongoose from 'mongoose';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_BYTES = 72;

export const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;

export const normalizeEmail = (email) => email.trim().toLowerCase();

export const isValidEmail = (email) => EMAIL_REGEX.test(email);

export const isValidObjectId = (id) => mongoose.isObjectIdOrHexString(id);

export const isPositiveInteger = (value) => Number.isInteger(value) && value > 0;

export const parseFutureDate = (value) => {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) || date <= new Date() ? null : date;
};
