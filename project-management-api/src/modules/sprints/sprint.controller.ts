import { Request, Response, NextFunction } from 'express';
import { sprintService } from './sprint.service';
import sendResponse from '../../shared/utils/response';
import AppError from '../../shared/utils/appError';

export class SprintController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Authentication required.', 401);
      const sprint = await sprintService.create(req.body, req.user.id);
      sendResponse({ res, statusCode: 201, success: true, message: 'Sprint created successfully.', data: sprint });
    } catch (error) { next(error); }
  }

  async getByProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Authentication required.', 401);
      const { projectId, workspaceId } = req.query;
      if (!projectId || !workspaceId) throw new AppError('projectId and workspaceId are required.', 400);
      const sprints = await sprintService.getByProject(projectId as string, workspaceId as string, req.user.id);
      sendResponse({ res, statusCode: 200, success: true, message: 'Sprints retrieved successfully.', data: sprints });
    } catch (error) { next(error); }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Authentication required.', 401);
      const sprint = await sprintService.getById(req.params.sprintId, req.user.id);
      sendResponse({ res, statusCode: 200, success: true, message: 'Sprint retrieved successfully.', data: sprint });
    } catch (error) { next(error); }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Authentication required.', 401);
      const sprint = await sprintService.update(req.params.sprintId, req.body, req.user.id);
      sendResponse({ res, statusCode: 200, success: true, message: 'Sprint updated successfully.', data: sprint });
    } catch (error) { next(error); }
  }

  async start(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Authentication required.', 401);
      const sprint = await sprintService.start(req.params.sprintId, req.user.id);
      sendResponse({ res, statusCode: 200, success: true, message: 'Sprint started.', data: sprint });
    } catch (error) { next(error); }
  }

  async complete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Authentication required.', 401);
      const sprint = await sprintService.complete(req.params.sprintId, req.user.id);
      sendResponse({ res, statusCode: 200, success: true, message: 'Sprint completed.', data: sprint });
    } catch (error) { next(error); }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Authentication required.', 401);
      await sprintService.delete(req.params.sprintId, req.user.id);
      sendResponse({ res, statusCode: 200, success: true, message: 'Sprint deleted successfully.' });
    } catch (error) { next(error); }
  }

  async addTasks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Authentication required.', 401);
      const { taskIds } = req.body;
      if (!taskIds || !Array.isArray(taskIds)) throw new AppError('taskIds array is required.', 400);
      const result = await sprintService.addTasks(req.params.sprintId, taskIds, req.user.id);
      sendResponse({ res, statusCode: 200, success: true, message: `${result.updatedCount} task(s) added to sprint.`, data: result });
    } catch (error) { next(error); }
  }

  async removeTasks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Authentication required.', 401);
      const { taskIds } = req.body;
      if (!taskIds || !Array.isArray(taskIds)) throw new AppError('taskIds array is required.', 400);
      const result = await sprintService.removeTasks(req.params.sprintId, taskIds, req.user.id);
      sendResponse({ res, statusCode: 200, success: true, message: `${result.updatedCount} task(s) removed from sprint.`, data: result });
    } catch (error) { next(error); }
  }

  async getAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Authentication required.', 401);
      const analytics = await sprintService.getAnalytics(req.params.sprintId, req.user.id);
      sendResponse({ res, statusCode: 200, success: true, message: 'Sprint analytics retrieved.', data: analytics });
    } catch (error) { next(error); }
  }

  async getBacklog(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Authentication required.', 401);
      const { projectId, workspaceId } = req.query;
      if (!projectId || !workspaceId) throw new AppError('projectId and workspaceId are required.', 400);
      const tasks = await sprintService.getBacklog(projectId as string, workspaceId as string, req.user.id);
      sendResponse({ res, statusCode: 200, success: true, message: 'Backlog retrieved successfully.', data: tasks });
    } catch (error) { next(error); }
  }
}

export default SprintController;
