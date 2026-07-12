import { Request, Response, NextFunction } from 'express';
import { teamService } from './team.service';
import sendResponse from '../../shared/utils/response';
import AppError from '../../shared/utils/appError';

export class TeamController {
  /**
   * POST /api/teams
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Authentication required.', 401);

      const { name, description, workspaceId, color, memberIds } = req.body;
      const team = await teamService.create(
        { name, description, workspaceId, color, memberIds },
        req.user.id
      );

      sendResponse({ res, statusCode: 201, success: true, message: 'Team created successfully.', data: team });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/teams?workspaceId=
   */
  async getByWorkspace(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Authentication required.', 401);

      const { workspaceId } = req.query;
      if (!workspaceId) throw new AppError('workspaceId is required.', 400);

      const teams = await teamService.getByWorkspace(workspaceId as string, req.user.id);

      sendResponse({ res, statusCode: 200, success: true, message: 'Teams retrieved successfully.', data: teams });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/teams/:teamId
   */
  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Authentication required.', 401);

      const { teamId } = req.params;
      const team = await teamService.getById(teamId, req.user.id);

      sendResponse({ res, statusCode: 200, success: true, message: 'Team retrieved successfully.', data: team });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/teams/:teamId
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Authentication required.', 401);

      const { teamId } = req.params;
      const { name, description, color } = req.body;
      const team = await teamService.update(teamId, { name, description, color }, req.user.id);

      sendResponse({ res, statusCode: 200, success: true, message: 'Team updated successfully.', data: team });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/teams/:teamId
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Authentication required.', 401);

      const { teamId } = req.params;
      await teamService.delete(teamId, req.user.id);

      sendResponse({ res, statusCode: 200, success: true, message: 'Team deleted successfully.' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/teams/:teamId/members
   */
  async addMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Authentication required.', 401);

      const { teamId } = req.params;
      const { userId } = req.body;
      if (!userId) throw new AppError('userId is required.', 400);

      const team = await teamService.addMember(teamId, userId, req.user.id);

      sendResponse({ res, statusCode: 200, success: true, message: 'Member added to team.', data: team });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/teams/:teamId/members/:userId
   */
  async removeMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Authentication required.', 401);

      const { teamId, userId } = req.params;
      const team = await teamService.removeMember(teamId, userId, req.user.id);

      sendResponse({ res, statusCode: 200, success: true, message: 'Member removed from team.', data: team });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/teams/:teamId/lead
   */
  async changeLead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Authentication required.', 401);

      const { teamId } = req.params;
      const { userId } = req.body;
      if (!userId) throw new AppError('userId is required.', 400);

      const team = await teamService.changeLead(teamId, userId, req.user.id);

      sendResponse({ res, statusCode: 200, success: true, message: 'Team lead updated.', data: team });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/teams/:teamId/stats
   */
  async getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Authentication required.', 401);

      const { teamId } = req.params;
      const stats = await teamService.getStats(teamId, req.user.id);

      sendResponse({ res, statusCode: 200, success: true, message: 'Team statistics retrieved.', data: stats });
    } catch (error) {
      next(error);
    }
  }
}

export default TeamController;
