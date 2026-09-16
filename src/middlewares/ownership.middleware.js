import { getManageableEvent } from '../services/events.service.js';
import { getCancellableTicket } from '../services/tickets.service.js';

// Carga el recurso a través del servicio (que decide si req.user puede actuar sobre él) y lo deja en req.resource.
// Los errores (400 / 404 / 403) siguen al middleware centralizado.
const loadAuthorizedResource = (load) => async (req, res, next) => {
  try {
    req.resource = await load(req);
    return next();
  } catch (error) {
    return next(error);
  }
};

// Dueño del evento (organizer) o admin. `param` es el nombre del parámetro de ruta con el id del evento.
export const authorizeEventOwner = (param = 'id') =>
  loadAuthorizedResource((req) => getManageableEvent(req.params[param], req.user));

// Dueño del ticket o admin.
export const authorizeTicketOwner = loadAuthorizedResource((req) => getCancellableTicket(req.params.tid, req.user));
