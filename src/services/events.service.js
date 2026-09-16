import { eventRepository } from '../repositories/event.repository.js';
import { EVENT_CATEGORIES, EVENT_STATUS } from '../models/event.model.js';
import { toPublicEvent } from '../dto/event.dto.js';
import { AppError } from '../utils/AppError.js';
import { isNonEmptyString, isPositiveInteger, isValidObjectId, parseFutureDate } from '../utils/validators.js';

const REQUIRED_FIELDS = ['title', 'category', 'date', 'capacity'];
const OPTIONAL_TEXT_FIELDS = ['description', 'location'];
const UPDATABLE_FIELDS = [...REQUIRED_FIELDS, ...OPTIONAL_TEXT_FIELDS];

const fieldValidators = {
  title: (value) => (isNonEmptyString(value) ? value.trim() : undefined),
  category: (value) => (EVENT_CATEGORIES.includes(value) ? value : undefined),
  date: (value) => parseFutureDate(value) ?? undefined,
  capacity: (value) => (isPositiveInteger(value) ? value : undefined),
  description: (value) => (typeof value === 'string' ? value.trim() : undefined),
  location: (value) => (typeof value === 'string' ? value.trim() : undefined),
};

const invalidFieldMessages = {
  title: 'El título no puede estar vacío',
  category: `La categoría debe ser una de: ${EVENT_CATEGORIES.join(', ')}`,
  date: 'La fecha debe ser válida y futura',
  capacity: 'El cupo debe ser un número entero mayor a 0',
  description: 'La descripción debe ser texto',
  location: 'La ubicación debe ser texto',
};

const sanitizeFields = (data, fields) =>
  fields
    .filter((field) => data[field] !== undefined)
    .reduce((clean, field) => {
      const value = fieldValidators[field](data[field]);
      if (value === undefined) throw new AppError(invalidFieldMessages[field], 400);
      return { ...clean, [field]: value };
    }, {});

export const getPublishedEvents = async () => {
  const events = await eventRepository.getByStatus(EVENT_STATUS.PUBLISHED);
  return events.map(toPublicEvent);
};

export const findEventById = async (id) => {
  if (!isValidObjectId(id)) throw new AppError('ID de evento inválido', 400);
  const event = await eventRepository.getById(id);
  if (!event) throw new AppError('Evento no encontrado', 404);
  return event;
};

export const getPublishedEventById = async (id) => {
  const event = await findEventById(id);
  if (event.status !== EVENT_STATUS.PUBLISHED) throw new AppError('Evento no encontrado', 404);
  return toPublicEvent(event);
};

export const createEvent = async (data, organizerId) => {
  if (!data || REQUIRED_FIELDS.some((field) => data[field] === undefined || data[field] === '')) {
    throw new AppError('Faltan campos obligatorios', 400);
  }
  const event = await eventRepository.create({ ...sanitizeFields(data, UPDATABLE_FIELDS), organizer: organizerId });
  return toPublicEvent(event);
};

const assertNotCancelled = (event) => {
  if (event.status === EVENT_STATUS.CANCELLED) throw new AppError('El evento está cancelado', 409);
};

export const updateEvent = async (event, data) => {
  assertNotCancelled(event);
  const changes = sanitizeFields(data ?? {}, UPDATABLE_FIELDS);
  if (Object.keys(changes).length === 0) {
    throw new AppError('No hay campos válidos para actualizar', 400);
  }
  const updated = await eventRepository.update(event._id, changes);
  return toPublicEvent(updated);
};

export const cancelEvent = async (event) => {
  assertNotCancelled(event);
  const updated = await eventRepository.update(event._id, { status: EVENT_STATUS.CANCELLED });
  return toPublicEvent(updated);
};
