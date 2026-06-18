import { Router } from 'express';
import { authenticate } from '../../shared/middleware/authenticate.js';
import { requireChatApp } from '../../shared/middleware/requireChatApp.js';
import { validateBody, validateParams } from '../../shared/middleware/validate.js';
import { chatController } from './chat.controller.js';
import { chatHeartbeatSchema, chatPeerUserIdParamsSchema } from './chat.validation.js';

const router = Router();

router.use(authenticate, requireChatApp);

router.get('/private', chatController.listPrivate);
router.get(
  '/private/:peerUserId',
  validateParams(chatPeerUserIdParamsSchema),
  chatController.getPrivateHistory,
);
router.post('/presence/heartbeat', validateBody(chatHeartbeatSchema), chatController.heartbeat);
router.get('/me', chatController.me);

export const chatRouter = router;
