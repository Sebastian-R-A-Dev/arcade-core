import { Router } from 'express';
import { authenticate } from '../../shared/middleware/authenticate.js';
import { difficultiesPlayerController } from './difficulties.player.controller.js';

const router = Router();

router.get('/', authenticate, difficultiesPlayerController.listForMyApp);

export const difficultiesPlayerRouter = router;
