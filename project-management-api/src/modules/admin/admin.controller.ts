import { Request, Response, NextFunction } from 'express';
import { adminService } from './admin.service';
import sendResponse from '../../shared/utils/response';
import AppError from '../../shared/utils/appError';

export class AdminController {
  async getSystemHealth(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await adminService.getSystemHealth();
      sendResponse({ res, statusCode: 200, success: true, message: 'System health retrieved.', data });
    } catch (error) { next(error); }
  }

  async getPlatformAnalytics(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await adminService.getPlatformAnalytics();
      sendResponse({ res, statusCode: 200, success: true, message: 'Platform analytics retrieved.', data });
    } catch (error) { next(error); }
  }

  async getUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page = '1', limit = '20', search } = req.query;
      const result = await adminService.getUsers(
        parseInt(page as string, 10) || 1,
        Math.min(parseInt(limit as string, 10) || 20, 100),
        search as string
      );
      sendResponse({ res, statusCode: 200, success: true, message: 'Users retrieved.', data: result.data, meta: result.meta });
    } catch (error) { next(error); }
  }

  async suspendUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Authentication required.', 401);
      const { userId } = req.params;
      await adminService.suspendUser(userId, req.user.id);
      sendResponse({ res, statusCode: 200, success: true, message: 'User suspended successfully.' });
    } catch (error) { next(error); }
  }

  async getAuditLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page = '1', limit = '50' } = req.query;
      const result = await adminService.getRecentAuditLogs(
        parseInt(page as string, 10) || 1,
        Math.min(parseInt(limit as string, 10) || 50, 100)
      );
      sendResponse({ res, statusCode: 200, success: true, message: 'Audit logs retrieved.', data: result.data, meta: result.meta });
    } catch (error) { next(error); }
  }
}

export default AdminController;
