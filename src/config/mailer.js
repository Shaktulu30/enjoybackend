import nodemailer from 'nodemailer';
import { config, missingMailVars } from './env.js';

export const isMailConfigured = missingMailVars().length === 0;

// Si faltan variables de email, la API funciona igual pero no envía correos (se avisa al iniciar el servidor).
export const transporter = isMailConfigured
  ? nodemailer.createTransport({
      host: config.mail.host,
      port: config.mail.port,
      secure: config.mail.port === 465,
      auth: { user: config.mail.user, pass: config.mail.pass },
    })
  : null;
