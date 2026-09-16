import { Router } from 'express';
import { getMyTickets, cancelTicket } from '../controllers/tickets.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorizeTicketOwner } from '../middlewares/ownership.middleware.js';

const router = Router();

router.get('/my-tickets', authenticate, getMyTickets);
router.patch('/:tid/cancel', authenticate, authorizeTicketOwner, cancelTicket);

export default router;
