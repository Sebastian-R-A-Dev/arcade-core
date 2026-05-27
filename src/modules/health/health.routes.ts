import { Router } from 'express';
import { healthController } from './health.controller.js';

const router = Router();

router.get('/', healthController.live);
router.get('/database', healthController.database);

export const healthRouter = router;
