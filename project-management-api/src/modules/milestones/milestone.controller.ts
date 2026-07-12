import { Request, Response, NextFunction } from 'express';
import { milestoneService } from './milestone.service';
import sendResponse from '../../shared/utils/response';
import AppError from '../../shared/utils/appError';

export class MilestoneController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Authentication required.', 401);
      const milestone = await milestoneService.create(req.body, req.user.id);
      sendResponse({ res, statusCode: 201, success: true, message: 'Milestone created successfully.', data: milestone });
    } catch (error) { next(error); }
  }

  async getByProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Authentication required.', 401);
      const { projectId, workspaceId } = req.query;
      if (!projectId || !workspaceId) throw new AppError('projectId and workspaceId are required.', 400);
      const milestones = await milestoneService.getByProject(projectId as string, workspaceId as string, req.user.id);
      sendResponse({ res, statusCode: 200, success: true, message: 'Milestones retrieved successfully.', data: milestones });
    } catch (error) { next(error); }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Authentication required.', 401);
      const milestone = await milestoneService.getById(req.params.milestoneId, req.user.id);
      sendResponse({ res, statusCode: 200, success: true, message: 'Milestone retrieved successfully.', data: milestone });
    } catch (error) { next(error); }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Authentication required.', 401);
      const milestone = await milestoneService.update(req.params.milestoneId, req.body, req.user.id);
      sendResponse({ res, statusCode: 200, success: true, message: 'Milestone updated successfully.', data: milestone });
    } catch (error) { next(error); }
  }

  async complete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Authentication required.', 401);
      const milestone = await milestoneService.complete(req.params.milestoneId, req.user.id);
      sendResponse({ res, statusCode: 200, success: true, message: 'Milestone completed.', data: milestone });
    } catch (error) { next(error); }
  }

  async reopen(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Authentication required.', 401);
      const milestone = await milestoneService.reopen(req.params.milestoneId, req.user.id);
      sendResponse({ res, statusCode: 200, success: true, message: 'Milestone reopened.', data: milestone });
    } catch (error) { next(error); }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Authentication required.', 401);
      await milestoneService.delete(req.params.milestoneId, req.user.id);
      sendResponse({ res, statusCode: 200, success: true, message: 'Milestone deleted successfully.' });
    } catch (error) { next(error); }
  }

  async getTasks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Authentication required.', 401);
      const tasks = await milestoneService.getTasks(req.params.milestoneId, req.user.id);
      sendResponse({ res, statusCode: 200, success: true, message: 'Milestone tasks retrieved.', data: tasks });
    } catch (error) { next(error); }
  }
}

export default MilestoneController;
