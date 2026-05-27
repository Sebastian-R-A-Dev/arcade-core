import { Router } from 'express';
import { authenticate } from '../../shared/middleware/authenticate.js';
import { validateQuery } from '../../shared/middleware/validate.js';
import { usersController } from '../users/users.controller.js';
import { meQuerySchema } from '../users/users.validation.js';

/** Public player profile (Bearer required). Same payload as GET /users/me. */
const router = Router();

router.get('/me', authenticate, validateQuery(meQuerySchema), usersController.me);

export const playerRouter = router;
