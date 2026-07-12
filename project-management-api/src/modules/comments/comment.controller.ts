import { Request, Response, NextFunction } from 'express';
import { commentService } from './comment.service';
import sendResponse from '../../shared/utils/response';
import AppError from '../../shared/utils/appError';

export class CommentController {
  /**
   * POST /api/tasks/:taskId/comments
   * Create a comment on a task.
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Authentication required.', 401);

      const { taskId } = req.params;
      const { content, plainText, mentions, parentCommentId } = req.body;

      const comment = await commentService.create(
        { taskId, content, plainText, mentions, parentCommentId },
        req.user.id
      );

      sendResponse({
        res,
        statusCode: 201,
        success: true,
        message: 'Comment added successfully.',
        data: comment,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/tasks/:taskId/comments?page=&limit=
   * Get comments for a task (paginated, pinned first).
   */
  async getByTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Authentication required.', 401);

      const { taskId } = req.params;
      const { page = '1', limit = '30' } = req.query;

      const result = await commentService.getByTask(taskId, req.user.id, {
        page: parseInt(page as string, 10) || 1,
        limit: Math.min(parseInt(limit as string, 10) || 30, 100),
      });

      sendResponse({
        res,
        statusCode: 200,
        success: true,
        message: 'Comments retrieved successfully.',
        data: result.data,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/comments/:commentId/replies
   * Get thread replies for a comment.
   */
  async getReplies(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Authentication required.', 401);

      const { commentId } = req.params;
      const replies = await commentService.getReplies(commentId, req.user.id);

      sendResponse({
        res,
        statusCode: 200,
        success: true,
        message: 'Replies retrieved successfully.',
        data: replies,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/comments/:commentId
   * Update a comment (author only).
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Authentication required.', 401);

      const { commentId } = req.params;
      const { content, plainText, mentions } = req.body;

      const comment = await commentService.update(
        commentId,
        { content, plainText, mentions },
        req.user.id
      );

      sendResponse({
        res,
        statusCode: 200,
        success: true,
        message: 'Comment updated successfully.',
        data: comment,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/comments/:commentId
   * Soft delete a comment.
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Authentication required.', 401);

      const { commentId } = req.params;
      await commentService.delete(commentId, req.user.id);

      sendResponse({
        res,
        statusCode: 200,
        success: true,
        message: 'Comment deleted successfully.',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/comments/:commentId/pin
   * Toggle pin on a comment.
   */
  async togglePin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Authentication required.', 401);

      const { commentId } = req.params;
      const comment = await commentService.togglePin(commentId, req.user.id);

      sendResponse({
        res,
        statusCode: 200,
        success: true,
        message: comment.isPinned ? 'Comment pinned.' : 'Comment unpinned.',
        data: comment,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/comments/:commentId/reactions
   * Toggle a reaction on a comment.
   */
  async toggleReaction(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Authentication required.', 401);

      const { commentId } = req.params;
      const { emoji } = req.body;

      if (!emoji) throw new AppError('Emoji is required.', 400);

      const comment = await commentService.toggleReaction(commentId, emoji, req.user.id);

      sendResponse({
        res,
        statusCode: 200,
        success: true,
        message: 'Reaction toggled.',
        data: { reactions: comment.reactions },
      });
    } catch (error) {
      next(error);
    }
  }
}

export default CommentController;
