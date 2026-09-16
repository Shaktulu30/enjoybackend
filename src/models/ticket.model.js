import mongoose from 'mongoose';

export const TICKET_STATUS = Object.freeze({
  CONFIRMED: 'confirmed',
  PENDING: 'pending',
  CANCELLED: 'cancelled',
});

// Estados que ocupan cupo. Los tickets cancelados no cuentan.
export const ACTIVE_TICKET_STATUSES = [TICKET_STATUS.CONFIRMED, TICKET_STATUS.PENDING];

const ticketSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    status: { type: String, enum: Object.values(TICKET_STATUS), default: TICKET_STATUS.CONFIRMED },
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
