export const EVENT_CATEGORIES = Object.freeze(['clase', 'workshop', 'torneo', 'actividad']);

export const EVENT_STATUS = Object.freeze({
  DRAFT: 'draft',
  PUBLISHED: 'published',
  CANCELLED: 'cancelled',
  FINISHED: 'finished',
});

export const EVENT_STATUS_VALUES = Object.freeze(Object.values(EVENT_STATUS));
