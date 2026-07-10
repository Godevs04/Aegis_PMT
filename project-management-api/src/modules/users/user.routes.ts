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

router.get('/me', controller.getMe);
router.patch(
  '/profile',
  uploadParser.single('avatar'),
  validate(updateProfileSchema),
  controller.updateProfile
);
router.patch('/password', validate(updatePasswordSchema), controller.updatePassword);
router.get('/search', controller.searchUsers);
router.delete('/me', controller.deleteMe);

export default router;
