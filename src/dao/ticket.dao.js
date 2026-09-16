import mongoose from 'mongoose';
import { TicketModel, TICKET_STATUS, ACTIVE_TICKET_STATUSES } from '../models/ticket.model.js';

export class TicketDAO {
  async create(data, session) {
    const [ticket] = await TicketModel.create([data], { session });
    return ticket.toObject();
  }

  findById(id) {
    return TicketModel.findById(id).lean();
  }

  findActiveByUserAndEvent(userId, eventId, session) {
    return TicketModel.findOne({ user: userId, event: eventId, status: { $in: ACTIVE_TICKET_STATUSES } })
      .session(session)
      .lean();
  }

  async sumActiveQuantity(eventId, session) {
    const [result] = await TicketModel.aggregate([
      { $match: { event: new mongoose.Types.ObjectId(eventId), status: { $in: ACTIVE_TICKET_STATUSES } } },
      { $group: { _id: null, total: { $sum: '$quantity' } } },
    ]).session(session);
    return result?.total ?? 0;
  }

  findByUserWithEvent(userId) {
    return TicketModel.find({ user: userId })
      .sort({ createdAt: -1 })
      .populate('event', 'title date location status')
      .lean();
  }

  findByEventWithUser(eventId) {
    return TicketModel.find({ event: eventId })
      .sort({ createdAt: 1 })
      .populate('user', 'first_name last_name email')
      .lean();
  }

  cancelIfActive(id) {
    return TicketModel.findOneAndUpdate(
      { _id: id, status: { $ne: TICKET_STATUS.CANCELLED } },
      { status: TICKET_STATUS.CANCELLED, cancelledAt: new Date() },
      { returnDocument: 'after' },
    ).lean();
  }
}
