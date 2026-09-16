import { EventModel } from '../models/event.model.js';

export class EventDAO {
  create(data) {
    return EventModel.create(data);
  }

  findByStatus(status) {
    return EventModel.find({ status }).sort({ date: 1 }).lean();
  }

  findById(id) {
    return EventModel.findById(id).lean();
  }

  updateById(id, data) {
    return EventModel.findByIdAndUpdate(id, data, { returnDocument: 'after', runValidators: true }).lean();
  }
}
