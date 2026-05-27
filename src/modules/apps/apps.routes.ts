import { Router } from 'express';
import { authenticate } from '../../shared/middleware/authenticate.js';
import { validateBody } from '../../shared/middleware/validate.js';
import { appsController } from './apps.controller.js';
import { createAppSchema } from './apps.validation.js';

const router = Router();

router.post(
  '/',
  authenticate,
  validateBody(createAppSchema),
  appsController.create,
);
router.get('/', appsController.list);

export const appsRouter = router;
