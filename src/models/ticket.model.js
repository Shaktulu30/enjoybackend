import mongoose from 'mongoose';
import { ACTIVE_TICKET_STATUSES, TICKET_STATUS, TICKET_STATUS_VALUES } from '../constants/ticket.constants.js';

const ticketSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    status: { type: String, enum: TICKET_STATUS_VALUES, default: TICKET_STATUS.CONFIRMED },
    quantity: { type: Number, required: true, min: 1 },
    reservationCode: { type: String, required: true, unique: true },
    cancelledAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// Una sola inscripción activa por usuario y evento (los cancelados quedan fuera del índice).
ticketSchema.index(
  { user: 1, event: 1 },
  { unique: true, partialFilterExpression: { status: { $in: ACTIVE_TICKET_STATUSES } } },
);
ticketSchema.index({ event: 1, status: 1 });

export const TicketModel = mongoose.model('Ticket', ticketSchema);
