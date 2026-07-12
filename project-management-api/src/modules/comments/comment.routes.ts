import { Router } from 'express';
import CommentController from './comment.controller';
import { protect } from '../../middlewares/auth';

const router = Router({ mergeParams: true });
const controller = new CommentController();

// All comment routes require authentication
router.use(protect);

// Task-scoped comment routes (mounted at /api/tasks/:taskId/comments)
router.post('/', controller.create);
router.get('/', controller.getByTask);

export default router;

/**
 * Standalone comment routes (mounted at /api/comments)
 * For operations that don't need taskId in the URL.
 */
export const commentStandaloneRoutes = (): Router => {
  const standaloneRouter = Router();

  standaloneRouter.use(protect);

  // Get thread replies
  standaloneRouter.get('/:commentId/replies', controller.getReplies);

  // Update comment
  standaloneRouter.patch('/:commentId', controller.update);

  // Delete comment
  standaloneRouter.delete('/:commentId', controller.delete);

  // Toggle pin
  standaloneRouter.post('/:commentId/pin', controller.togglePin);

  // Toggle reaction
  standaloneRouter.post('/:commentId/reactions', controller.toggleReaction);

  return standaloneRouter;
};
