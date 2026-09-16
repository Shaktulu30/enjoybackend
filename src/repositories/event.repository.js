import { EventDAO } from '../dao/event.dao.js';

class EventRepository {
  constructor(dao) {
    this.dao = dao;
  }

  create(data) {
    return this.dao.create(data);
  }

  getByStatus(status) {
    return this.dao.findByStatus(status);
  }

  getById(id) {
    return this.dao.findById(id);
  }

  update(id, data) {
    return this.dao.updateById(id, data);
  }
}

export const eventRepository = new EventRepository(new EventDAO());
