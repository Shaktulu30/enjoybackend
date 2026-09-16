import { ticketRepository } from '../repositories/ticket.repository.js';
import { eventRepository } from '../repositories/event.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import { transactionRepository } from '../repositories/transaction.repository.js';
import { EVENT_STATUS } from '../constants/event.constants.js';
import { TICKET_STATUS } from '../constants/ticket.constants.js';
import { MESSAGES } from '../constants/messages.js';
import { PERMISSIONS } from '../config/roles.js';
import { toTicket, toMyTicket, toEventAttendeeTicket } from '../dto/ticket.dto.js';
import { sendEnrollmentConfirmation } from './mail.service.js';
import { AppError } from '../utils/AppError.js';
import { isOwnerOrPrivileged } from '../utils/permissions.js';
import { generateReservationCode } from '../utils/reservationCode.js';
import { isPositiveInteger, isValidObjectId } from '../utils/validators.js';

const DEFAULT_QUANTITY = 1;
const DUPLICATE_KEY_ERROR = 11000;
const DUPLICATE_TICKET_MESSAGE = 'Ya tenés una inscripción activa para este evento';

const parseQuantity = (value) => {
  const quantity = value ?? DEFAULT_QUANTITY;
  if (!isPositiveInteger(quantity)) {
    throw new AppError('quantity debe ser un número entero mayor a 0', 400);
  }
  return quantity;
};

const assertEventOpenForEnrollment = (event) => {
  if (!event || event.status === EVENT_STATUS.DRAFT) throw new AppError('Evento no encontrado', 404);
  if (event.status === EVENT_STATUS.CANCELLED) {
    throw new AppError('No se puede inscribir a un evento cancelado', 409);
  }
  if (event.status === EVENT_STATUS.FINISHED || event.date <= new Date()) {
    throw new AppError('No se puede inscribir a un evento finalizado', 409);
  }
};

const assertSeatsAvailable = (event, occupied, quantity) => {
  const available = Math.max(event.capacity - occupied, 0);
  if (available === 0) throw new AppError('El evento no tiene cupos disponibles', 409);
  if (quantity > available) {
    throw new AppError(`No hay cupos suficientes: quedan ${available} y solicitaste ${quantity}`, 409);
  }
};

const notifyEnrollment = async (userId, event, ticket) => {
  try {
    const user = await userRepository.findById(userId);
    await sendEnrollmentConfirmation({ user, event, ticket });
  } catch (error) {
    console.error(`No se pudo enviar el email de confirmación del ticket ${ticket.reservationCode}:`, error.message);
  }
};

// Inscripción: todo ocurre en una transacción para que dos pedidos simultáneos no superen el cupo.
export const enroll = async (eventId, userId, body) => {
  if (!isValidObjectId(eventId)) throw new AppError('ID de evento inválido', 400);
  const quantity = parseQuantity(body?.quantity);

  let enrolledEvent;
  let ticket;
  try {
    await transactionRepository.run(async (session) => {
      const event = await eventRepository.lockForEnrollment(eventId, session);
      assertEventOpenForEnrollment(event);

      if (await ticketRepository.findActiveByUserAndEvent(userId, eventId, session)) {
        throw new AppError(DUPLICATE_TICKET_MESSAGE, 409);
      }

      const occupied = await ticketRepository.countOccupiedSeats(eventId, session);
      assertSeatsAvailable(event, occupied, quantity);

      ticket = await ticketRepository.create(
        {
          user: userId,
          event: eventId,
          quantity,
          status: TICKET_STATUS.CONFIRMED,
          reservationCode: generateReservationCode(),
        },
        session,
      );
      enrolledEvent = event;
    });
  } catch (error) {
    if (error.code === DUPLICATE_KEY_ERROR) throw new AppError(DUPLICATE_TICKET_MESSAGE, 409);
    throw error;
  }

  // El email se envía después de confirmar la transacción y no bloquea la respuesta.
  notifyEnrollment(userId, enrolledEvent, ticket);
  return toTicket(ticket);
};

export const getMyTickets = async (userId) => {
  const tickets = await ticketRepository.findByUserWithEvent(userId);
  return tickets.map(toMyTicket);
};

export const getEventTickets = async (event) => {
  const [tickets, occupied] = await Promise.all([
    ticketRepository.findByEventWithAttendees(event._id),
    ticketRepository.countOccupiedSeats(event._id),
  ]);
  return {
    event: {
      id: event._id.toString(),
      title: event.title,
      status: event.status,
      capacity: event.capacity,
      occupied,
      available: Math.max(event.capacity - occupied, 0),
    },
    tickets: tickets.map(toEventAttendeeTicket),
  };
};

// Permiso sobre recurso propio: el dueño del ticket o un rol con permiso sobre cualquier ticket (admin).
export const getCancellableTicket = async (id, user) => {
  if (!isValidObjectId(id)) throw new AppError('ID de ticket inválido', 400);
  const ticket = await ticketRepository.findById(id);
  if (!ticket) throw new AppError('Ticket no encontrado', 404);
  if (!isOwnerOrPrivileged(ticket.user, user, PERMISSIONS.TICKETS_CANCEL_ANY)) {
    throw new AppError(MESSAGES.FORBIDDEN, 403);
  }
  return ticket;
};

// Cancelar no borra el ticket: cambia el estado y registra cancelledAt. El cupo se libera porque ya no se cuenta.
export const cancelTicket = async (ticket) => {
  if (ticket.status === TICKET_STATUS.CANCELLED) throw new AppError('El ticket ya está cancelado', 409);
  const cancelled = await ticketRepository.cancelTicket(ticket._id);
  if (!cancelled) throw new AppError('El ticket ya está cancelado', 409);
  return toTicket(cancelled);
};
