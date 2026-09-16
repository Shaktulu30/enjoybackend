import { randomInt } from 'node:crypto';

// Sin caracteres ambiguos (0/O, 1/I/L) para que el código sea fácil de dictar o copiar.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 8;

export const generateReservationCode = () =>
  `ENJ-${Array.from({ length: CODE_LENGTH }, () => ALPHABET[randomInt(ALPHABET.length)]).join('')}`;
