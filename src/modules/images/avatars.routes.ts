import { Router } from 'express';
import { validateQuery } from '../../shared/middleware/validate.js';
import { avatarsController } from './avatars.controller.js';
import { publicListAvatarsQuerySchema } from './image.validation.js';

const router = Router();

router.get('/', validateQuery(publicListAvatarsQuerySchema), avatarsController.listPublic);

export const avatarsRouter = router;
