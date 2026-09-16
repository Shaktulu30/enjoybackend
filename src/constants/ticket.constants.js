export const TICKET_STATUS = Object.freeze({
  CONFIRMED: 'confirmed',
  PENDING: 'pending',
  CANCELLED: 'cancelled',
});

export const TICKET_STATUS_VALUES = Object.freeze(Object.values(TICKET_STATUS));

// Estados que ocupan cupo. Los tickets cancelados no cuentan.
export const ACTIVE_TICKET_STATUSES = Object.freeze([TICKET_STATUS.CONFIRMED, TICKET_STATUS.PENDING]);
