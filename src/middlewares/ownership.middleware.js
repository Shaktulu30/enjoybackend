import { PERMISSIONS } from '../config/roles.js';
import { findEventById } from '../services/events.service.js';
import { sendError } from '../utils/response.js';
import { FORBIDDEN_MESSAGE } from './authorize.middleware.js';

// Carga el recurso y permite continuar solo si req.user es su dueño o tiene un rol con permiso sobre cualquier recurso.
// El recurso cargado queda en req.resource para que el controller no lo vuelva a buscar.
const authorizeOwnership = ({ loadResource, ownerField, bypassRoles }) => async (req, res, next) => {
  try {
    const resource = await loadResource(req);
    const isOwner = resource[ownerField]?.toString() === req.user.id;
    if (!isOwner && !bypassRoles.includes(req.user.role)) {
      return sendError(res, FORBIDDEN_MESSAGE, 403);
    }
    req.resource = resource;
    return next();
  } catch (error) {
    return next(error);
  }
};

export const authorizeEventOwner = authorizeOwnership({
  loadResource: (req) => findEventById(req.params.id),
  ownerField: 'organizer',
  bypassRoles: PERMISSIONS.EVENTS_MANAGE_ANY,
});
