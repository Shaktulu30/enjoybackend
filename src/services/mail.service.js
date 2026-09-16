import nodemailer from 'nodemailer';
import { config } from '../config/env.js';
import { isMailConfigured, transporter } from '../config/mailer.js';

const escapeHtml = (text = '') =>
  String(text).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

const formatDate = (date) =>
  new Date(date).toLocaleString('es-AR', { dateStyle: 'full', timeStyle: 'short', timeZone: 'America/Argentina/Buenos_Aires' });

export const sendEnrollmentConfirmation = async ({ user, event, ticket }) => {
  if (!isMailConfigured) return null;

  const details = [
    ['Evento', event.title],
    ['Fecha', formatDate(event.date)],
    ['Lugar', event.location],
    ['Lugares reservados', ticket.quantity],
    ['Código de reserva', ticket.reservationCode],
  ];

  const text = [
    `Hola ${user.first_name},`,
    '',
    'Tu inscripción en Enjoy quedó confirmada.',
    '',
    ...details.map(([label, value]) => `${label}: ${value}`),
    '',
    'Presentá el código de reserva al llegar. ¡Te esperamos!',
  ].join('\n');

  const html = `
    <h2>¡Inscripción confirmada!</h2>
    <p>Hola ${escapeHtml(user.first_name)}, tu lugar en Enjoy está reservado.</p>
    <table cellpadding="6">
      ${details.map(([label, value]) => `<tr><td><strong>${label}</strong></td><td>${escapeHtml(value)}</td></tr>`).join('')}
    </table>
    <p>Presentá el código de reserva al llegar. ¡Te esperamos!</p>
  `;

  const info = await transporter.sendMail({
    from: config.mail.from,
    to: user.email,
    subject: `Inscripción confirmada: ${event.title}`,
    text,
    html,
  });

  const previewUrl = nodemailer.getTestMessageUrl(info);
  console.log(`Email de confirmación enviado a ${user.email}${previewUrl ? ` (vista previa: ${previewUrl})` : ''}`);
  return info;
};
