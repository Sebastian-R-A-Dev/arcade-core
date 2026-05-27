import { Router } from 'express';
import { validateQuery } from '../../shared/middleware/validate.js';
import { leaderboardController } from './leaderboard.controller.js';
import { leaderboardQuerySchema } from './leaderboard.validation.js';

/** Public leaderboard (no auth). */
const router = Router();

router.get('/', validateQuery(leaderboardQuerySchema), leaderboardController.list);

export const leaderboardRouter = router;
