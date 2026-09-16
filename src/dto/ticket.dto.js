const refId = (ref) => (ref?._id ?? ref).toString();

const baseTicket = (ticket) => ({
  id: ticket._id.toString(),
  reservationCode: ticket.reservationCode,
  status: ticket.status,
  quantity: ticket.quantity,
  createdAt: ticket.createdAt,
  cancelledAt: ticket.cancelledAt,
});

export const toTicket = (ticket) => ({
  ...baseTicket(ticket),
  event: refId(ticket.event),
  user: refId(ticket.user),
});

// Para "mis tickets": datos básicos del evento, sin información de otros usuarios.
export const toMyTicket = (ticket) => ({
  ...baseTicket(ticket),
  event: ticket.event && {
    id: ticket.event._id.toString(),
    title: ticket.event.title,
    date: ticket.event.date,
    location: ticket.event.location,
    status: ticket.event.status,
  },
});

// Para el organizer/admin: quién se inscribió (sin datos sensibles).
export const toEventAttendeeTicket = (ticket) => ({
  ...baseTicket(ticket),
  user: ticket.user && {
    id: ticket.user._id.toString(),
    first_name: ticket.user.first_name,
    last_name: ticket.user.last_name,
    email: ticket.user.email,
  },
});
