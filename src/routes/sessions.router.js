import { Router } from 'express';
import { register, login, current, logout } from '../controllers/sessions.controller.js';
import { authenticate, passportCall } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/register', passportCall('register'), register);
router.post('/login', passportCall('login'), login);
router.get('/current', authenticate, current);
router.post('/logout', logout);

export default router;
