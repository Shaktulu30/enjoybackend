import { Router } from 'express';
import { getUsers, updateUserRole } from '../controllers/users.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/authorize.middleware.js';
import { PERMISSIONS } from '../config/roles.js';

const router = Router();

router.get('/', authenticate, authorize(PERMISSIONS.USERS_READ_ALL), getUsers);
router.patch('/:uid/role', authenticate, authorize(PERMISSIONS.USERS_UPDATE_ROLE), updateUserRole);

export default router;
