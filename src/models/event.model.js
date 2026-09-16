import mongoose from 'mongoose';

export const EVENT_CATEGORIES = ['clase', 'workshop', 'torneo', 'actividad'];

export const EVENT_STATUS = Object.freeze({
  PUBLISHED: 'published',
  CANCELLED: 'cancelled',
});

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    category: { type: String, enum: EVENT_CATEGORIES, required: true },
    date: { type: Date, required: true },
    location: { type: String, trim: true },
    capacity: { type: Number, required: true, min: 1 },
    organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: Object.values(EVENT_STATUS), default: EVENT_STATUS.PUBLISHED },
  },
  { timestamps: true },
);

export const EventModel = mongoose.model('Event', eventSchema);
