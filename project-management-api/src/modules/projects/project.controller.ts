import { Request, Response, NextFunction } from 'express';
import ProjectService from './project.service';
import sendResponse from '../../shared/utils/response';
import AppError from '../../shared/utils/appError';

const projectService = new ProjectService();

export class ProjectController {
  /**
   * POST /api/projects
   * Create a new project.
   */
  async createProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Authentication required.', 401);

      const { name, prefix, description, workspaceId, startDate, endDate, tags } = req.body;

      const project = await projectService.createProject(
        { name, prefix, description, workspaceId, startDate, endDate, tags },
        req.user.id
      );

      sendResponse({
        res,
        statusCode: 201,
        success: true,
        message: 'Project created successfully.',
        data: project,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/projects?workspaceId=&status=&search=
   * List workspace projects with optional filters.
   */
  async getWorkspaceProjects(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Authentication required.', 401);

      const { workspaceId, status, search } = req.query;

      const projects = await projectService.getProjectsByWorkspace(
        workspaceId as string,
        req.user.id,
        {
          status: status as any,
          search: search as string,
        }
      );

      sendResponse({
        res,
        statusCode: 200,
        success: true,
        message: 'Projects retrieved successfully.',
        data: projects,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/projects/:projectId
   * Get single project details.
   */
  async getProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Authentication required.', 401);

      const { projectId } = req.params;
      const project = await projectService.getProjectById(projectId, req.user.id);

      sendResponse({
        res,
        statusCode: 200,
        success: true,
        message: 'Project retrieved successfully.',
        data: project,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/projects/:projectId
   * Update project details.
   */
  async updateProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Authentication required.', 401);

      const { projectId } = req.params;
      const project = await projectService.updateProject(projectId, req.body, req.user.id);

      sendResponse({
        res,
        statusCode: 200,
        success: true,
        message: 'Project updated successfully.',
        data: project,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/projects/:projectId/archive
   * Archive a project.
   */
  async archiveProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Authentication required.', 401);

      const { projectId } = req.params;
      const project = await projectService.archiveProject(projectId, req.user.id);

      sendResponse({
        res,
        statusCode: 200,
        success: true,
        message: 'Project archived successfully.',
        data: project,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/projects/:projectId/restore
   * Restore an archived project.
   */
  async restoreProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Authentication required.', 401);

      const { projectId } = req.params;
      const project = await projectService.restoreProject(projectId, req.user.id);

      sendResponse({
        res,
        statusCode: 200,
        success: true,
        message: 'Project restored successfully.',
        data: project,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/projects/:projectId
   * Soft delete a project.
   */
  async deleteProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Authentication required.', 401);

      const { projectId } = req.params;
      await projectService.deleteProject(projectId, req.user.id);

      sendResponse({
        res,
        statusCode: 200,
        success: true,
        message: 'Project deleted successfully.',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/projects/:projectId/analytics
   * Get project analytics (task counts, completion rate, overdue).
   */
  async getAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Authentication required.', 401);

      const { projectId } = req.params;
      const analytics = await projectService.getProjectAnalytics(projectId, req.user.id);

      sendResponse({
        res,
        statusCode: 200,
        success: true,
        message: 'Project analytics retrieved successfully.',
        data: analytics,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/projects/:projectId/members
   * Get project members.
   */
  async getMembers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Authentication required.', 401);

      const { projectId } = req.params;
      const members = await projectService.getProjectMembers(projectId, req.user.id);

      sendResponse({
        res,
        statusCode: 200,
        success: true,
        message: 'Project members retrieved successfully.',
        data: members,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/projects/:projectId/members
   * Add a member to the project.
   */
  async addMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Authentication required.', 401);

      const { projectId } = req.params;
      const { userId, role } = req.body;

      await projectService.addProjectMember(projectId, userId, role, req.user.id);

      sendResponse({
        res,
        statusCode: 201,
        success: true,
        message: 'Member added to project successfully.',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/projects/:projectId/members/:userId
   * Remove a member from the project.
   */
  async removeMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Authentication required.', 401);

      const { projectId, userId } = req.params;
      await projectService.removeProjectMember(projectId, userId, req.user.id);

      sendResponse({
        res,
        statusCode: 200,
        success: true,
        message: 'Member removed from project successfully.',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default ProjectController;
