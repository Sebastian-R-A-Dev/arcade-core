import { Router } from 'express';
import { authenticate } from '../../shared/middleware/authenticate.js';
import {
  authLoginLimiter,
  authRefreshLimiter,
} from '../../shared/middleware/rateLimiters.js';
import { validateBody } from '../../shared/middleware/validate.js';
import { authController } from './auth.controller.js';
import {
  completePasswordChangeSchema,
  loginSchema,
  logoutSchema,
  refreshSchema,
  registerSchema,
} from './auth.validation.js';

const router = Router();

router.post(
  '/register',
  validateBody(registerSchema),
  authController.register,
);
router.post(
  '/login',
  authLoginLimiter,
  validateBody(loginSchema),
  authController.login,
);
router.post(
  '/refresh',
  authRefreshLimiter,
  validateBody(refreshSchema),
  authController.refresh,
);
router.post('/logout', validateBody(logoutSchema), authController.logout);
router.post(
  '/complete-password-change',
  authenticate,
  validateBody(completePasswordChangeSchema),
  authController.completePasswordChange,
);

export const authRouter = router;
