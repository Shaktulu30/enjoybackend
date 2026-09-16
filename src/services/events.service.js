import { eventRepository } from '../repositories/event.repository.js';
import { EVENT_CATEGORIES, EVENT_STATUS, EVENT_STATUS_VALUES } from '../constants/event.constants.js';
import { MESSAGES } from '../constants/messages.js';
import { PERMISSIONS } from '../config/roles.js';
import { toPublicEvent } from '../dto/event.dto.js';
import { AppError } from '../utils/AppError.js';
import { isOwnerOrPrivileged } from '../utils/permissions.js';
import {
  isDateOnly,
  isNonEmptyString,
  isNonNegativeNumber,
  isPositiveInteger,
  isValidObjectId,
  parseDate,
  parseIntegerParam,
} from '../utils/validators.js';

const { DRAFT, PUBLISHED, CANCELLED, FINISHED } = EVENT_STATUS;

const REQUIRED_FIELDS = ['title', 'description', 'category', 'date', 'location', 'capacity'];
const EDITABLE_FIELDS = [...REQUIRED_FIELDS, 'price'];
const INITIAL_STATUSES = [DRAFT, PUBLISHED];
const PUBLIC_STATUSES = [PUBLISHED, CANCELLED, FINISHED];

// Transiciones de estado permitidas. Cancelados y finalizados son estados terminales.
const STATUS_TRANSITIONS = {
  [DRAFT]: [PUBLISHED, CANCELLED],
  [PUBLISHED]: [DRAFT, CANCELLED, FINISHED],
  [CANCELLED]: [],
  [FINISHED]: [],
};

const LIST_QUERY_PARAMS = ['status', 'category', 'location', 'dateFrom', 'dateTo', 'page', 'limit', 'sort'];
const SORTABLE_FIELDS = ['date', 'price', 'capacity', 'title', 'createdAt'];
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;
const DEFAULT_SORT = 'date';

// ---------- Validación de campos ----------

const textField = (label) => (value) => {
  if (!isNonEmptyString(value)) throw new AppError(`${label} no puede estar vacío`, 400);
  return value.trim();
};

const fieldParsers = {
  title: textField('El título'),
  description: textField('La descripción'),
  location: textField('La ubicación'),
  category: (value) => {
    if (!EVENT_CATEGORIES.includes(value)) {
      throw new AppError(`La categoría debe ser una de: ${EVENT_CATEGORIES.join(', ')}`, 400);
    }
    return value;
  },
  date: (value) => {
    const date = parseDate(value);
    if (!date) throw new AppError('La fecha del evento es inválida', 400);
    if (date <= new Date()) throw new AppError('La fecha del evento no puede ser pasada', 400);
    return date;
  },
  capacity: (value) => {
    if (!isPositiveInteger(value)) throw new AppError('El cupo (capacity) debe ser un número entero mayor a 0', 400);
    return value;
  },
  price: (value) => {
    if (!isNonNegativeNumber(value)) throw new AppError('El precio (price) debe ser un número mayor o igual a 0', 400);
    return value;
  },
};

const parseFields = (data, fields) =>
  fields
    .filter((field) => data[field] !== undefined)
    .reduce((parsed, field) => ({ ...parsed, [field]: fieldParsers[field](data[field]) }), {});

// ---------- Reglas de negocio ----------

const assertNotCancelled = (event) => {
  if (event.status === CANCELLED) throw new AppError('Un evento cancelado no puede modificarse', 409);
};

const assertStatusTransition = (event, nextStatus) => {
  assertNotCancelled(event);
  if (event.status === nextStatus) throw new AppError(`El evento ya está en estado "${nextStatus}"`, 409);
  if (nextStatus === PUBLISHED && [FINISHED, CANCELLED].includes(event.status)) {
    throw new AppError('No se puede publicar un evento finalizado o cancelado', 409);
  }
  if (!STATUS_TRANSITIONS[event.status].includes(nextStatus)) {
    throw new AppError(`No se puede cambiar un evento de "${event.status}" a "${nextStatus}"`, 409);
  }
};

// ---------- Listado ----------

const parseListQuery = (query) => {
  const repeated = LIST_QUERY_PARAMS.find((param) => query[param] !== undefined && typeof query[param] !== 'string');
  if (repeated) throw new AppError(`El parámetro ${repeated} debe enviarse una sola vez`, 400);

  const { status = PUBLISHED, category, location, dateFrom, dateTo, sort = DEFAULT_SORT } = query;

  if (!PUBLIC_STATUSES.includes(status)) {
    throw new AppError(`El filtro status debe ser uno de: ${PUBLIC_STATUSES.join(', ')}`, 400);
  }
  if (category !== undefined && !EVENT_CATEGORIES.includes(category)) {
    throw new AppError(`El filtro category debe ser uno de: ${EVENT_CATEGORIES.join(', ')}`, 400);
  }
  if (location !== undefined && !isNonEmptyString(location)) {
    throw new AppError('El filtro location no puede estar vacío', 400);
  }

  const from = dateFrom === undefined ? undefined : parseDate(dateFrom);
  const to = dateTo === undefined ? undefined : parseDate(dateTo);
  if (from === null) throw new AppError('dateFrom debe ser una fecha válida (ej. 2027-03-01)', 400);
  if (to === null) throw new AppError('dateTo debe ser una fecha válida (ej. 2027-03-31)', 400);
  // Si dateTo es solo una fecha (sin hora), incluye todo ese día.
  if (to && isDateOnly(dateTo)) to.setUTCHours(23, 59, 59, 999);
  if (from && to && from > to) throw new AppError('dateFrom no puede ser posterior a dateTo', 400);

  const page = parseIntegerParam(query.page) ?? DEFAULT_PAGE;
  const limit = parseIntegerParam(query.limit) ?? DEFAULT_LIMIT;
  if (!(page >= 1)) throw new AppError('page debe ser un entero mayor o igual a 1', 400);
  if (!(limit >= 1 && limit <= MAX_LIMIT)) throw new AppError(`limit debe ser un entero entre 1 y ${MAX_LIMIT}`, 400);

  const sortDirection = sort.startsWith('-') ? -1 : 1;
  const sortField = sort.replace(/^-/, '');
  if (!SORTABLE_FIELDS.includes(sortField)) {
    throw new AppError(`sort debe ser uno de: ${SORTABLE_FIELDS.join(', ')} (prefijo "-" para descendente)`, 400);
  }

  return {
    criteria: { status, category, location: location?.trim(), dateFrom: from, dateTo: to },
    pagination: { page, limit, sortField, sortDirection },
  };
};

// ---------- Casos de uso ----------

export const listEvents = async (query) => {
  const { criteria, pagination } = parseListQuery(query);
  const { events, total } = await eventRepository.findEvents(criteria, pagination);
  return {
    data: events.map(toPublicEvent),
    page: pagination.page,
    limit: pagination.limit,
    total,
    totalPages: Math.ceil(total / pagination.limit),
  };
};

export const findEventById = async (id) => {
  if (!isValidObjectId(id)) throw new AppError('ID de evento inválido', 400);
  const event = await eventRepository.findById(id);
  if (!event) throw new AppError('Evento no encontrado', 404);
  return event;
};

export const getPublicEventById = async (id) => {
  const event = await findEventById(id);
  if (event.status === DRAFT) throw new AppError('Evento no encontrado', 404);
  return toPublicEvent(event);
};

// Permiso sobre recurso propio: el organizer dueño o un rol con permiso sobre cualquier evento (admin).
export const getManageableEvent = async (id, user) => {
  const event = await findEventById(id);
  if (!isOwnerOrPrivileged(event.organizer, user, PERMISSIONS.EVENTS_MANAGE_ANY)) {
    throw new AppError(MESSAGES.FORBIDDEN, 403);
  }
  return event;
};

export const createEvent = async (data, organizerId) => {
  if (!data || REQUIRED_FIELDS.some((field) => data[field] === undefined || data[field] === null || data[field] === '')) {
    throw new AppError(MESSAGES.MISSING_FIELDS, 400);
  }

  const status = data.status ?? PUBLISHED;
  if (!INITIAL_STATUSES.includes(status)) {
    throw new AppError(`Al crear, status debe ser uno de: ${INITIAL_STATUSES.join(', ')}`, 400);
  }

  const event = await eventRepository.create({
    ...parseFields(data, EDITABLE_FIELDS),
    status,
    organizer: organizerId,
  });
  return toPublicEvent(event);
};

export const updateEvent = async (event, data) => {
  assertNotCancelled(event);
  const changes = parseFields(data ?? {}, EDITABLE_FIELDS);
  if (Object.keys(changes).length === 0) {
    throw new AppError(`No hay campos válidos para actualizar (${EDITABLE_FIELDS.join(', ')})`, 400);
  }
  const updated = await eventRepository.update(event._id, changes);
  return toPublicEvent(updated);
};

export const changeEventStatus = async (event, nextStatus) => {
  if (!EVENT_STATUS_VALUES.includes(nextStatus)) {
    throw new AppError(`status debe ser uno de: ${EVENT_STATUS_VALUES.join(', ')}`, 400);
  }
  assertStatusTransition(event, nextStatus);
  const updated = await eventRepository.update(event._id, { status: nextStatus });
  return toPublicEvent(updated);
};
