import { EventDAO } from '../dao/event.dao.js';

class EventRepository {
  constructor(dao) {
    this.dao = dao;
  }

  create(data) {
    return this.dao.create(data);
  }

  paginate(criteria, options) {
    return this.dao.paginate(criteria, options);
  }

  getById(id) {
    return this.dao.findById(id);
  }

  update(id, data) {
    return this.dao.updateById(id, data);
  }
}

export const eventRepository = new EventRepository(new EventDAO());
