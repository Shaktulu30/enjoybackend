import mongoose from 'mongoose';
import { EVENT_CATEGORIES, EVENT_STATUS, EVENT_STATUS_VALUES } from '../constants/event.constants.js';

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: { type: String, enum: EVENT_CATEGORIES, required: true },
    date: { type: Date, required: true },
    location: { type: String, required: true, trim: true },
    capacity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0, default: 0 },
    status: { type: String, enum: EVENT_STATUS_VALUES, default: EVENT_STATUS.PUBLISHED },
    organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // Se incrementa en cada inscripción dentro de la transacción: fuerza un conflicto de escritura entre
    // inscripciones simultáneas al mismo evento para que no se supere el cupo.
    enrollmentVersion: { type: Number, default: 0, select: false },
  },
  { timestamps: true },
);

eventSchema.index({ status: 1, date: 1 });

export const EventModel = mongoose.model('Event', eventSchema);
