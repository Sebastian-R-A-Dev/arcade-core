import { Router } from 'express';
import { authenticate } from '../../shared/middleware/authenticate.js';
import { validateQuery } from '../../shared/middleware/validate.js';
import { questionsController } from './questions.controller.js';
import { myQuestionsQuerySchema } from './questions.validation.js';

const router = Router();

router.get(
  '/',
  authenticate,
  validateQuery(myQuestionsQuerySchema),
  questionsController.listForMyApp,
);
router.get(
  '/random',
  authenticate,
  validateQuery(myQuestionsQuerySchema),
  questionsController.randomForMyApp,
);

export const questionsRouter = router;
