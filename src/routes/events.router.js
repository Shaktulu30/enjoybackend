import { Router } from 'express';
import { getEvents, getEventById, createEvent, updateEvent, changeEventStatus } from '../controllers/events.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/authorize.middleware.js';
import { authorizeEventOwner } from '../middlewares/ownership.middleware.js';
import { PERMISSIONS } from '../config/roles.js';

const router = Router();

router.get('/', getEvents);
router.get('/:id', getEventById);
router.post('/', authenticate, authorize(PERMISSIONS.EVENTS_CREATE), createEvent);
router.put('/:id', authenticate, authorize(PERMISSIONS.EVENTS_UPDATE_OWN), authorizeEventOwner, updateEvent);
router.patch(
  '/:id/status',
  authenticate,
  authorize(PERMISSIONS.EVENTS_CHANGE_STATUS_OWN),
  authorizeEventOwner,
  changeEventStatus,
);

export default router;
