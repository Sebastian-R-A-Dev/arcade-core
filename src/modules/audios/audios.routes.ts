import { Router } from 'express';
import { authenticate } from '../../shared/middleware/authenticate.js';
import { validateBody, validateQuery } from '../../shared/middleware/validate.js';
import { audiosController } from './audios.controller.js';
import { audioUpload } from './audio.upload.js';
import { handleMulterAudioError } from './audio.middleware.js';
import { listAudiosQuerySchema, uploadAudioBodySchema } from './audio.validation.js';

const router = Router();

router.use(authenticate);

router.get('/', validateQuery(listAudiosQuerySchema), audiosController.list);

router.post(
  '/',
  audioUpload.single('audio'),
  handleMulterAudioError,
  validateBody(uploadAudioBodySchema),
  audiosController.upload,
);

export const audiosRouter = router;
