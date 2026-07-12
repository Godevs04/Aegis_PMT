import { Request, Response, NextFunction } from 'express';
import { Role } from './role.model';
import sendResponse from '../../shared/utils/response';
import AppError from '../../shared/utils/appError';

export class RoleController {
  /**
   * Get all system roles (for assignment dropdowns, member management, etc.)
   */
  async getSystemRoles(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const roles = await Role.find({ isSystem: true })
        .select('name slug description permissions')
        .sort({ slug: 1 });

      sendResponse({
        res,
        statusCode: 200,
        success: true,
        message: 'System roles retrieved successfully',
        data: roles,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a specific role by ID
   */
  async getRoleById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const role = await Role.findById(id);

      if (!role) {
        throw new AppError('Role not found.', 404);
      }

      sendResponse({
        res,
        statusCode: 200,
        success: true,
        message: 'Role retrieved successfully',
        data: role,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default RoleController;
