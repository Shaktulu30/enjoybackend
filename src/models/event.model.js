import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    category: { type: String, enum: ['clase', 'workshop', 'torneo', 'actividad'], required: true },
    date: { type: Date, required: true },
    location: { type: String, trim: true },
    capacity: { type: Number, required: true, min: 1 },
    organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

export const EventModel = mongoose.model('Event', eventSchema);
