import { Router } from 'express';
import { authenticate } from '../../shared/middleware/authenticate.js';
import { validateQuery } from '../../shared/middleware/validate.js';
import { usersController } from './users.controller.js';
import { meQuerySchema } from './users.validation.js';

const router = Router();

router.get('/me', authenticate, validateQuery(meQuerySchema), usersController.me);

export const usersRouter = router;
