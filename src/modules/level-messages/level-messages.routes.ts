import { Router } from 'express';
import { validateQuery } from '../../shared/middleware/validate.js';
import { levelMessagesController } from './level-messages.controller.js';
import { resolveLevelMessageQuerySchema } from './level-messages.validation.js';

const router = Router();

router.get('/resolve', validateQuery(resolveLevelMessageQuerySchema), levelMessagesController.resolve);

export const levelMessagesRouter = router;
