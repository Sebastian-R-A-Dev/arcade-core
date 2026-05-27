import { Router } from 'express';
import { authenticate } from '../../shared/middleware/authenticate.js';
import { requireAdminApp } from '../../shared/middleware/requireAdminApp.js';
import { requireAdministratorRole } from '../../shared/middleware/requireAdministratorRole.js';
import {
  adminListQuestionsQuerySchema,
  adminQuestionIdParamsSchema,
  createQuestionSchema,
  updateQuestionBodySchema,
} from '../quiz/questions.validation.js';
import { questionsController } from '../quiz/questions.controller.js';
import { validateBody, validateQuery, validateParams } from '../../shared/middleware/validate.js';
import { appsController } from '../apps/apps.controller.js';
import {
  adminAppIdParamsSchema,
  createAppSchema,
  updateAppBodySchema,
} from '../apps/apps.validation.js';
import { accountEventsController } from '../account-events/account-events.controller.js';
import { adminController } from './admin.controller.js';
import {
  adminCreateUserSchema,
  adminUpdateUserSchema,
  adminUserIdParamsSchema,
} from '../users/users.validation.js';
import { difficultiesController } from '../difficulties/difficulties.controller.js';
import {
  adminDifficultyIdParamsSchema,
  adminListDifficultiesQuerySchema,
  createDifficultySchema,
  updateDifficultyBodySchema,
} from '../difficulties/difficulties.validation.js';
import { questionTypesController } from '../question-types/question-types.controller.js';
import {
  adminListQuestionTypesQuerySchema,
  adminQuestionTypeIdParamsSchema,
  createQuestionTypeSchema,
  updateQuestionTypeBodySchema,
} from '../question-types/question-types.validation.js';
import { adminImagesController } from '../images/admin-images.controller.js';
import { imageController } from '../images/image.controller.js';
import { imageUpload } from '../images/image.upload.js';
import { handleMulterImageError } from '../images/image.middleware.js';
import {
  adminDeleteImageParamsSchema,
  adminListImagesQuerySchema,
  deleteImageBodySchema,
  uploadImageBodySchema,
} from '../images/image.validation.js';
import { userProgressController } from '../user-progress/user-progress.controller.js';
import { adminSetUserProgressSchema } from '../user-progress/user-progress.validation.js';
import { levelMessagesController } from '../level-messages/level-messages.controller.js';
import {
  adminCreateLevelMessageSchema,
  adminLevelMilestoneParamsSchema,
  adminUpsertLevelMessageSchema,
} from '../level-messages/level-messages.validation.js';

const router = Router();

router.use(authenticate, requireAdminApp, requireAdministratorRole);

router.get('/roles', adminController.listRoles);
router.get('/users', adminController.listUsers);
router.post('/users', validateBody(adminCreateUserSchema), adminController.createUser);
router.patch(
  '/users/:id',
  validateParams(adminUserIdParamsSchema),
  validateBody(adminUpdateUserSchema),
  adminController.updateUser,
);
router.delete(
  '/users/:id',
  validateParams(adminUserIdParamsSchema),
  adminController.deleteUser,
);
router.post(
  '/users/:id/reset-password',
  validateParams(adminUserIdParamsSchema),
  adminController.resetUserPassword,
);
router.get('/player-progress', userProgressController.listAdmin);
router.patch(
  '/users/:id/progress',
  validateParams(adminUserIdParamsSchema),
  validateBody(adminSetUserProgressSchema),
  userProgressController.setLevelForUser,
);
router.get('/account-events', accountEventsController.listAdmin);
router.get('/level-messages', levelMessagesController.listAdmin);
router.post(
  '/level-messages',
  validateBody(adminCreateLevelMessageSchema),
  levelMessagesController.createAdmin,
);
router.put(
  '/level-messages/:level',
  validateParams(adminLevelMilestoneParamsSchema),
  validateBody(adminUpsertLevelMessageSchema),
  levelMessagesController.upsertAdmin,
);
router.delete(
  '/level-messages/:level',
  validateParams(adminLevelMilestoneParamsSchema),
  levelMessagesController.deleteAdmin,
);
router.get('/apps', adminController.listApps);
router.post('/apps', validateBody(createAppSchema), appsController.create);
router.patch(
  '/apps/:id',
  validateParams(adminAppIdParamsSchema),
  validateBody(updateAppBodySchema),
  appsController.updateById,
);
router.delete('/apps/:id', validateParams(adminAppIdParamsSchema), appsController.removeById);

router.get(
  '/difficulties',
  validateQuery(adminListDifficultiesQuerySchema),
  difficultiesController.list,
);
router.post('/difficulties', validateBody(createDifficultySchema), difficultiesController.create);
router.patch(
  '/difficulties/:id',
  validateParams(adminDifficultyIdParamsSchema),
  validateBody(updateDifficultyBodySchema),
  difficultiesController.updateById,
);
router.delete(
  '/difficulties/:id',
  validateParams(adminDifficultyIdParamsSchema),
  difficultiesController.removeById,
);

router.get(
  '/question-types',
  validateQuery(adminListQuestionTypesQuerySchema),
  questionTypesController.list,
);
router.post('/question-types', validateBody(createQuestionTypeSchema), questionTypesController.create);
router.patch(
  '/question-types/:id',
  validateParams(adminQuestionTypeIdParamsSchema),
  validateBody(updateQuestionTypeBodySchema),
  questionTypesController.updateById,
);
router.delete(
  '/question-types/:id',
  validateParams(adminQuestionTypeIdParamsSchema),
  questionTypesController.removeById,
);

router.post('/questions', validateBody(createQuestionSchema), questionsController.create);
router.patch(
  '/questions/:id',
  validateParams(adminQuestionIdParamsSchema),
  validateBody(updateQuestionBodySchema),
  questionsController.updateById,
);
router.delete(
  '/questions/:id',
  validateParams(adminQuestionIdParamsSchema),
  questionsController.removeById,
);
router.get(
  '/questions',
  validateQuery(adminListQuestionsQuerySchema),
  questionsController.listAdmin,
);

router.get('/images', validateQuery(adminListImagesQuerySchema), adminImagesController.list);

router.delete(
  '/images/:id',
  validateParams(adminDeleteImageParamsSchema),
  adminImagesController.removeById,
);

router.delete('/images', validateBody(deleteImageBodySchema), imageController.remove);

router.post(
  '/images',
  imageUpload.single('image'),
  handleMulterImageError,
  validateBody(uploadImageBodySchema),
  adminImagesController.upload,
);

export const adminRouter = router;
