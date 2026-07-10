import { Router } from 'express';
import NotificationController from './notification.controller';
import { protect } from '../../middlewares/auth';

const router = Router();
const controller = new NotificationController();

router.use(protect);

router.get('/', controller.getMyNotifications);
router.patch('/:notificationId/read', controller.markRead);
router.post('/read-all', controller.markAllRead);

export default router;
