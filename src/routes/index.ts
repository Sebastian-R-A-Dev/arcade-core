import { Router } from 'express';
import { adminRouter } from '../modules/admin/admin.routes.js';
import { authRouter } from '../modules/auth/auth.routes.js';
import { appsRouter } from '../modules/apps/apps.routes.js';
import { questionsRouter } from '../modules/quiz/questions.routes.js';
import { scoresRouter } from '../modules/scores/scores.routes.js';
import { usersRouter } from '../modules/users/users.routes.js';
import { avatarsRouter } from '../modules/images/avatars.routes.js';
import { challengeRouter } from '../modules/challenge/challenge.routes.js';
import { playerRouter } from '../modules/player/player.routes.js';
import { leaderboardRouter } from '../modules/leaderboard/leaderboard.routes.js';
import { levelMessagesRouter } from '../modules/level-messages/level-messages.routes.js';
import { difficultiesPlayerRouter } from '../modules/difficulties/difficulties.player.routes.js';
import { audiosRouter } from '../modules/audios/audios.routes.js';

const router = Router();

router.use('/audios', audiosRouter);
router.use('/avatars', avatarsRouter);
router.use('/auth', authRouter);
router.use('/admin', adminRouter);
router.use('/apps', appsRouter);
router.use('/challenge', challengeRouter);
router.use('/difficulties', difficultiesPlayerRouter);
router.use('/questions', questionsRouter);
router.use('/scores', scoresRouter);
router.use('/users', usersRouter);
router.use('/player', playerRouter);
router.use('/leaderboard', leaderboardRouter);
router.use('/level-messages', levelMessagesRouter);

export const apiV1Router = router;
