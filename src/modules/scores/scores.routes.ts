import { Router } from 'express';
import { authenticate } from '../../shared/middleware/authenticate.js';
import { validateBody } from '../../shared/middleware/validate.js';
import { scoresController } from './scores.controller.js';
import { createScoreSchema } from './scores.validation.js';

const router = Router();

router.post(
  '/',
  authenticate,
  validateBody(createScoreSchema),
  scoresController.create,
);

export const scoresRouter = router;
