import { Router } from 'express';
import { getEvents, getEventById, createEvent, updateEvent, changeEventStatus } from '../controllers/events.controller.js';
import { createTicket, getEventTickets } from '../controllers/tickets.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/authorize.middleware.js';
import { authorizeEventOwner } from '../middlewares/ownership.middleware.js';
import { PERMISSIONS } from '../config/roles.js';

const router = Router();

router.get('/', getEvents);
router.get('/:id', getEventById);
router.post('/', authenticate, authorize(PERMISSIONS.EVENTS_CREATE), createEvent);
router.put('/:id', authenticate, authorize(PERMISSIONS.EVENTS_UPDATE_OWN), authorizeEventOwner('id'), updateEvent);
router.patch(
  '/:id/status',
  authenticate,
  authorize(PERMISSIONS.EVENTS_CHANGE_STATUS_OWN),
  authorizeEventOwner('id'),
  changeEventStatus,
);

router.post('/:eid/tickets', authenticate, authorize(PERMISSIONS.TICKETS_CREATE), createTicket);
router.get(
  '/:eid/tickets',
  authenticate,
  authorize(PERMISSIONS.TICKETS_READ_EVENT_OWN),
  authorizeEventOwner('eid'),
  getEventTickets,
);

export default router;
