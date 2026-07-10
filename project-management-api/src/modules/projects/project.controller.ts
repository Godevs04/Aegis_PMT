import { Request, Response, NextFunction } from 'express';
import ProjectService from './project.service';
import sendResponse from '../../shared/utils/response';
import AppError from '../../shared/utils/appError';

const projectService = new ProjectService();

export class ProjectController {
  /**
   * Create Project
   */
  async createProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        throw new AppError('Authentication credentials not found.', 401);
      }

      const { name, description, workspaceId } = req.body;
      const project = await projectService.createProject(name, description, workspaceId, user.id);

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
   * Get Projects belonging to a Workspace
   */
  async getWorkspaceProjects(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        throw new AppError('Authentication credentials not found.', 401);
      }

      const workspaceId = req.query.workspaceId as string;
      const projects = await projectService.getProjectsByWorkspace(workspaceId, user.id);

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
   * Update Project Details
   */
  async updateProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        throw new AppError('Authentication credentials not found.', 401);
      }

      const { projectId } = req.params;
      const project = await projectService.updateProject(projectId, req.body, user.id);

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
   * Soft Delete Project
   */
  async deleteProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        throw new AppError('Authentication credentials not found.', 401);
      }

      const { projectId } = req.params;
      await projectService.deleteProject(projectId, user.id);

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
}

export default ProjectController;
