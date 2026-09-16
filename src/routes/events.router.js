import { Router } from 'express';
import { getEvents, getEventById, createEvent, updateEvent, cancelEvent } from '../controllers/events.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/authorize.middleware.js';
import { authorizeEventOwner } from '../middlewares/ownership.middleware.js';
import { PERMISSIONS } from '../config/roles.js';

const router = Router();

router.get('/', getEvents);
router.get('/:eid', getEventById);
router.post('/', authenticate, authorize(PERMISSIONS.EVENTS_CREATE), createEvent);
router.put('/:eid', authenticate, authorize(PERMISSIONS.EVENTS_UPDATE_OWN), authorizeEventOwner, updateEvent);
router.patch('/:eid/cancel', authenticate, authorize(PERMISSIONS.EVENTS_CANCEL_OWN), authorizeEventOwner, cancelEvent);

export default router;
