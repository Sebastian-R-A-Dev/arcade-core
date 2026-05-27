import { Router } from 'express';
import { authenticate } from '../../shared/middleware/authenticate.js';
import { requireChallengeSession } from '../../shared/middleware/requireChallengeSession.js';
import { validateBody } from '../../shared/middleware/validate.js';
import { challengeController } from './challenge.controller.js';
import {
  challengeAnswerSchema,
  challengeTimeoutSchema,
} from './challenge.validation.js';

const router = Router();

router.post('/start', authenticate, challengeController.start);
router.post('/spin', authenticate, requireChallengeSession, challengeController.spin);
router.post(
  '/answer',
  authenticate,
  requireChallengeSession,
  validateBody(challengeAnswerSchema),
  challengeController.answer,
);
router.post(
  '/timeout',
  authenticate,
  requireChallengeSession,
  validateBody(challengeTimeoutSchema),
  challengeController.timeout,
);
router.post('/forfeit', authenticate, requireChallengeSession, challengeController.forfeit);

export const challengeRouter = router;
