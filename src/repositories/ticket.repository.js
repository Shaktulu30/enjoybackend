import { TicketDAO } from '../dao/ticket.dao.js';
import { ACTIVE_TICKET_STATUSES, TICKET_STATUS } from '../constants/ticket.constants.js';

const activeTicketsFilter = (filter) => ({ ...filter, status: { $in: ACTIVE_TICKET_STATUSES } });

class TicketRepository {
  constructor(dao) {
    this.dao = dao;
  }

  create(data, session) {
    return this.dao.create(data, { session });
  }

  findById(id) {
    return this.dao.findById(id);
  }

  findActiveByUserAndEvent(userId, eventId, session) {
    return this.dao.findOne(activeTicketsFilter({ user: userId, event: eventId }), { session });
  }

  // Lugares ocupados: suma de quantity de los tickets activos (los cancelados no cuentan).
  countOccupiedSeats(eventId, session) {
    return this.dao.sum(activeTicketsFilter({ event: eventId }), 'quantity', { session });
  }

  findByUserWithEvent(userId) {
    return this.dao.find(
      { user: userId },
      { sort: { createdAt: -1 }, populate: { path: 'event', select: 'title date location status' } },
    );
  }

  findByEventWithAttendees(eventId) {
    return this.dao.find(
      { event: eventId },
      { sort: { createdAt: 1 }, populate: { path: 'user', select: 'first_name last_name email' } },
    );
  }

  // Cancelación lógica: solo actualiza si el ticket todavía no estaba cancelado.
  cancelTicket(id) {
    return this.dao.updateOne(
      { _id: id, status: { $ne: TICKET_STATUS.CANCELLED } },
      { status: TICKET_STATUS.CANCELLED, cancelledAt: new Date() },
    );
  }
}

export const ticketRepository = new TicketRepository(new TicketDAO());
