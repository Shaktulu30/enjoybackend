import { EventDAO } from '../dao/event.dao.js';

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildEventFilter = ({ status, category, location, dateFrom, dateTo }) => {
  const filter = { status };
  if (category) filter.category = category;
  if (location) filter.location = { $regex: escapeRegex(location), $options: 'i' };
  if (dateFrom || dateTo) {
    filter.date = {};
    if (dateFrom) filter.date.$gte = dateFrom;
    if (dateTo) filter.date.$lte = dateTo;
  }
  return filter;
};

class EventRepository {
  constructor(dao) {
    this.dao = dao;
  }

  create(data) {
    return this.dao.create(data);
  }

  findById(id) {
    return this.dao.findById(id);
  }

  // Listado filtrado y paginado: devuelve la página pedida y el total de coincidencias.
  async findEvents(criteria, { page, limit, sortField, sortDirection }) {
    const filter = buildEventFilter(criteria);
    const [events, total] = await Promise.all([
      this.dao.find(filter, { sort: { [sortField]: sortDirection, _id: 1 }, skip: (page - 1) * limit, limit }),
      this.dao.count(filter),
    ]);
    return { events, total };
  }

  update(id, changes) {
    return this.dao.updateById(id, changes);
  }

  // Toma el evento dentro de la transacción de inscripción (ver enrollmentVersion en el modelo).
  lockForEnrollment(id, session) {
    return this.dao.updateById(id, { $inc: { enrollmentVersion: 1 } }, { session, timestamps: false, runValidators: false });
  }
}

export const eventRepository = new EventRepository(new EventDAO());
