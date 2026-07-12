import { Request, Response, NextFunction } from 'express';
import { dashboardService } from './dashboard.service';
import sendResponse from '../../shared/utils/response';
import AppError from '../../shared/utils/appError';

export class DashboardController {
  /**
   * GET /api/dashboard/personal?workspaceId=
   */
  async getPersonal(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Authentication required.', 401);
      const { workspaceId } = req.query;
      if (!workspaceId) throw new AppError('workspaceId is required.', 400);

      const data = await dashboardService.getPersonalDashboard(req.user.id, workspaceId as string);
      sendResponse({ res, statusCode: 200, success: true, message: 'Personal dashboard retrieved.', data });
    } catch (error) { next(error); }
  }

  /**
   * GET /api/dashboard/workspace?workspaceId=
   */
  async getWorkspace(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Authentication required.', 401);
      const { workspaceId } = req.query;
      if (!workspaceId) throw new AppError('workspaceId is required.', 400);

      const data = await dashboardService.getWorkspaceDashboard(workspaceId as string, req.user.id);
      sendResponse({ res, statusCode: 200, success: true, message: 'Workspace dashboard retrieved.', data });
    } catch (error) { next(error); }
  }

  /**
   * GET /api/dashboard/project/:projectId?workspaceId=
   */
  async getProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Authentication required.', 401);
      const { projectId } = req.params;
      const { workspaceId } = req.query;
      if (!workspaceId) throw new AppError('workspaceId is required.', 400);

      const data = await dashboardService.getProjectDashboard(projectId, workspaceId as string, req.user.id);
      sendResponse({ res, statusCode: 200, success: true, message: 'Project dashboard retrieved.', data });
    } catch (error) { next(error); }
  }
}

export default DashboardController;
