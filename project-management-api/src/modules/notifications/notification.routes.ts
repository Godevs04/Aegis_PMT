import { Router } from 'express';
import NotificationController from './notification.controller';
import { protect } from '../../middlewares/auth';

const router = Router();
const controller = new NotificationController();

// All notification routes require authentication
router.use(protect);

// Get user's notifications (paginated)
router.get('/', controller.getMyNotifications);

// Get unread count
router.get('/unread-count', controller.getUnreadCount);

// Mark single notification as read
router.patch('/:notificationId/read', controller.markRead);

// Mark all notifications as read
router.post('/read-all', controller.markAllRead);

// Get notification preferences
router.get('/preferences', controller.getPreferences);

// Update notification preferences
router.put('/preferences', controller.updatePreferences);

export default router;
