import { EventModel } from '../models/event.model.js';

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildFilter = ({ status, category, location, dateFrom, dateTo }) => {
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

export class EventDAO {
  create(data) {
    return EventModel.create(data);
  }

  async paginate(criteria, { page, limit, sortField, sortDirection }) {
    const filter = buildFilter(criteria);
    const [docs, total] = await Promise.all([
      EventModel.find(filter)
        .sort({ [sortField]: sortDirection, _id: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      EventModel.countDocuments(filter),
    ]);
    return { docs, total };
  }

  findById(id) {
    return EventModel.findById(id).lean();
  }

  lockForEnrollment(id, session) {
    return EventModel.findByIdAndUpdate(id, { $inc: { enrollmentVersion: 1 } }, { returnDocument: 'after', session, timestamps: false }).lean();
  }

  updateById(id, data) {
    return EventModel.findByIdAndUpdate(id, data, { returnDocument: 'after', runValidators: true }).lean();
  }
}
