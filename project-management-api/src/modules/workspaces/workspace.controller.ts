import { Request, Response, NextFunction } from 'express';
import WorkspaceService from './workspace.service';
import sendResponse from '../../shared/utils/response';
import AppError from '../../shared/utils/appError';

const workspaceService = new WorkspaceService();

export class WorkspaceController {
  /**
   * Create Workspace
   */
  async createWorkspace(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        throw new AppError('Authentication credentials not found.', 401);
      }

      const { name, orgName } = req.body;
      const workspace = await workspaceService.createWorkspace(name, user.id, orgName);

      sendResponse({
        res,
        statusCode: 201,
        success: true,
        message: 'Workspace created successfully.',
        data: workspace,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get My Workspaces
   */
  async getMyWorkspaces(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        throw new AppError('Authentication credentials not found.', 401);
      }

      const workspaces = await workspaceService.getMyWorkspaces(user.id);

      sendResponse({
        res,
        statusCode: 200,
        success: true,
        message: 'Workspaces retrieved successfully.',
        data: workspaces,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Invite member to workspace
   */
  async inviteMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        throw new AppError('Authentication credentials not found.', 401);
      }

      const { workspaceId } = req.params;
      const { email, role } = req.body;

      const invitation = await workspaceService.inviteMember(
        workspaceId,
        user.id,
        email,
        role
      );

      sendResponse({
        res,
        statusCode: 200,
        success: true,
        message: `Invitation email sent successfully to ${email}.`,
        data: {
          id: invitation.id,
          email: invitation.email,
          role: invitation.role,
          status: invitation.status,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Accept workspace invitation
   */
  async acceptInvitation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        throw new AppError('Authentication credentials not found.', 401);
      }

      const { token } = req.body;
      const workspace = await workspaceService.acceptInvitation(token, user.id);

      sendResponse({
        res,
        statusCode: 200,
        success: true,
        message: 'Joined workspace successfully.',
        data: workspace,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default WorkspaceController;
