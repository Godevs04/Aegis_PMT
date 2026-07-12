import { Request, Response, NextFunction } from 'express';
import { attachmentService } from './attachment.service';
import { AttachmentEntityType } from './attachment.model';
import sendResponse from '../../shared/utils/response';
import AppError from '../../shared/utils/appError';

export class AttachmentController {
  /**
   * POST /api/attachments
   * Upload a file attachment.
   * Body (multipart/form-data): file, entityType, entityId, workspaceId
   */
  async upload(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Authentication required.', 401);

      const file = req.file;
      if (!file) {
        throw new AppError('No file provided. Please attach a file to the request.', 400);
      }

      const { entityType, entityId, workspaceId, organizationId } = req.body;

      if (!entityType || !entityId || !workspaceId) {
        throw new AppError('entityType, entityId, and workspaceId are required.', 400);
      }

      const validEntityTypes: AttachmentEntityType[] = ['Task', 'Project', 'Comment', 'Organization', 'Workspace'];
      if (!validEntityTypes.includes(entityType)) {
        throw new AppError(`Invalid entityType. Must be one of: ${validEntityTypes.join(', ')}`, 400);
      }

      const attachment = await attachmentService.upload({
        file,
        entityType,
        entityId,
        workspaceId,
        organizationId,
        uploadedBy: req.user.id,
      });

      sendResponse({
        res,
        statusCode: 201,
        success: true,
        message: 'File uploaded successfully.',
        data: attachment,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/attachments?entityType=&entityId=&page=&limit=
   * List attachments for a specific entity.
   */
  async listByEntity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Authentication required.', 401);

      const { entityType, entityId, page = '1', limit = '20' } = req.query;

      if (!entityType || !entityId) {
        throw new AppError('entityType and entityId query parameters are required.', 400);
      }

      const result = await attachmentService.listByEntity(
        entityType as AttachmentEntityType,
        entityId as string,
        {
          page: parseInt(page as string, 10) || 1,
          limit: Math.min(parseInt(limit as string, 10) || 20, 100),
        }
      );

      sendResponse({
        res,
        statusCode: 200,
        success: true,
        message: 'Attachments retrieved successfully.',
        data: result.data,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/attachments/workspace/:workspaceId?page=&limit=
   * List all attachments in a workspace.
   */
  async listByWorkspace(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Authentication required.', 401);

      const { workspaceId } = req.params;
      const { page = '1', limit = '30' } = req.query;

      const result = await attachmentService.listByWorkspace(workspaceId, {
        page: parseInt(page as string, 10) || 1,
        limit: Math.min(parseInt(limit as string, 10) || 30, 100),
      });

      sendResponse({
        res,
        statusCode: 200,
        success: true,
        message: 'Workspace attachments retrieved successfully.',
        data: result.data,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/attachments/usage/:workspaceId
   * Get storage usage statistics for a workspace.
   */
  async getStorageUsage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Authentication required.', 401);

      const { workspaceId } = req.params;
      const usage = await attachmentService.getStorageUsage(workspaceId);

      sendResponse({
        res,
        statusCode: 200,
        success: true,
        message: 'Storage usage retrieved successfully.',
        data: usage,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/attachments/:attachmentId
   * Get a single attachment by ID.
   */
  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Authentication required.', 401);

      const { attachmentId } = req.params;
      const attachment = await attachmentService.getById(attachmentId);

      sendResponse({
        res,
        statusCode: 200,
        success: true,
        message: 'Attachment retrieved successfully.',
        data: attachment,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/attachments/:attachmentId
   * Delete an attachment.
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Authentication required.', 401);

      const { attachmentId } = req.params;
      await attachmentService.delete(attachmentId, req.user.id);

      sendResponse({
        res,
        statusCode: 200,
        success: true,
        message: 'Attachment deleted successfully.',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default AttachmentController;
