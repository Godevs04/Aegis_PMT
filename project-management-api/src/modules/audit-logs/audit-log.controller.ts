import { Request, Response, NextFunction } from 'express';
import { auditLogService } from './audit-log.service';
import { AuditEntityType, AuditAction } from './audit-log.model';
import sendResponse from '../../shared/utils/response';
import AppError from '../../shared/utils/appError';

export class AuditLogController {
  /**
   * GET /api/audit-logs
   *
   * Query audit logs with filters and pagination.
   * Requires admin:view_audit permission (enforced at route level).
   *
   * Query params:
   *   - workspaceId (required)
   *   - entityType (optional)
   *   - entityId (optional)
   *   - performedBy (optional)
   *   - action (optional)
   *   - from (optional, ISO date)
   *   - to (optional, ISO date)
   *   - page (optional, default 1)
   *   - limit (optional, default 50)
   */
  async getAuditLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('Authentication required.', 401);
      }

      const {
        workspaceId,
        organizationId,
        entityType,
        entityId,
        performedBy,
        action,
        from,
        to,
        page = '1',
        limit = '50',
      } = req.query;

      if (!workspaceId && !organizationId) {
        throw new AppError('Either workspaceId or organizationId query parameter is required.', 400);
      }

      const filters: any = {};
      if (workspaceId) filters.workspaceId = workspaceId as string;
      if (organizationId) filters.organizationId = organizationId as string;
      if (entityType) filters.entityType = entityType as AuditEntityType;
      if (entityId) filters.entityId = entityId as string;
      if (performedBy) filters.performedBy = performedBy as string;
      if (action) filters.action = action as AuditAction;
      if (from) filters.fromDate = new Date(from as string);
      if (to) filters.toDate = new Date(to as string);

      const result = await auditLogService.query(filters, {
        page: parseInt(page as string, 10) || 1,
        limit: Math.min(parseInt(limit as string, 10) || 50, 100), // Cap at 100
      });

      sendResponse({
        res,
        statusCode: 200,
        success: true,
        message: 'Audit logs retrieved successfully',
        data: result.data,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/audit-logs/entity/:entityType/:entityId
   *
   * Get full audit history for a specific entity.
   */
  async getEntityHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('Authentication required.', 401);
      }

      const { entityType, entityId } = req.params;
      const { page = '1', limit = '20' } = req.query;

      if (!entityType || !entityId) {
        throw new AppError('entityType and entityId are required.', 400);
      }

      const result = await auditLogService.getByEntity(
        entityType as AuditEntityType,
        entityId,
        {
          page: parseInt(page as string, 10) || 1,
          limit: Math.min(parseInt(limit as string, 10) || 20, 100),
        }
      );

      sendResponse({
        res,
        statusCode: 200,
        success: true,
        message: 'Entity audit history retrieved successfully',
        data: result.data,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default AuditLogController;
