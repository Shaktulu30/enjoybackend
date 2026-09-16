import { TicketDAO } from '../dao/ticket.dao.js';

class TicketRepository {
  constructor(dao) {
    this.dao = dao;
  }

  create(data, session) {
    return this.dao.create(data, session);
  }

  getById(id) {
    return this.dao.findById(id);
  }

  getActiveByUserAndEvent(userId, eventId, session) {
    return this.dao.findActiveByUserAndEvent(userId, eventId, session);
  }

  countOccupiedSeats(eventId, session) {
    return this.dao.sumActiveQuantity(eventId, session);
  }

  getByUserWithEvent(userId) {
    return this.dao.findByUserWithEvent(userId);
  }

  getByEventWithUser(eventId) {
    return this.dao.findByEventWithUser(eventId);
  }

  cancel(id) {
    return this.dao.cancelIfActive(id);
  }
}

export const ticketRepository = new TicketRepository(new TicketDAO());
