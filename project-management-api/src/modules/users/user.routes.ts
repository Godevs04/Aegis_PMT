import { Router } from 'express';
import UserController from './user.controller';
import { protect } from '../../middlewares/auth';
import validate from '../../middlewares/validate';
import { uploadParser } from '../../services/upload.service';
import { updateProfileSchema, updatePasswordSchema } from './user.validation';

const router = Router();
const controller = new UserController();

// Protect all routes under user module
router.use(protect);

// Profile
router.get('/me', controller.getMe);
router.patch(
  '/profile',
  uploadParser.single('avatar'),
  validate(updateProfileSchema),
  controller.updateProfile
);
router.patch('/password', validate(updatePasswordSchema), controller.updatePassword);

// Onboarding
router.get('/onboarding-status', controller.getOnboardingStatus);
router.post(
  '/complete-profile',
  uploadParser.single('avatar'),
  controller.completeProfile
);

// Search & Delete
router.get('/search', controller.searchUsers);
router.delete('/me', controller.deleteMe);

export default router;
