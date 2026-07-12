import { Request, Response, NextFunction } from 'express';
import { organizationService } from './organization.service';
import sendResponse from '../../shared/utils/response';
import AppError from '../../shared/utils/appError';

export class OrganizationController {
  /**
   * POST /api/organizations
   * Create a new organization.
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Authentication required.', 401);

      const { name, description } = req.body;

      const result = await organizationService.create(
        { name, description },
        req.user.id
      );

      sendResponse({
        res,
        statusCode: 201,
        success: true,
        message: 'Organization created successfully.',
        data: {
          organization: result.organization,
          workspaceId: result.workspaceId,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/organizations
   * List user's organizations.
   */
  async getMyOrganizations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Authentication required.', 401);

      const organizations = await organizationService.getMyOrganizations(req.user.id);

      sendResponse({
        res,
        statusCode: 200,
        success: true,
        message: 'Organizations retrieved successfully.',
        data: organizations,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/organizations/:organizationId
   * Get organization details.
   */
  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Authentication required.', 401);

      const { organizationId } = req.params;
      const organization = await organizationService.getById(organizationId, req.user.id);

      sendResponse({
        res,
        statusCode: 200,
        success: true,
        message: 'Organization retrieved successfully.',
        data: organization,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/organizations/:organizationId
   * Update organization details.
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Authentication required.', 401);

      const { organizationId } = req.params;
      const { name, description, logo, settings } = req.body;

      const organization = await organizationService.update(
        organizationId,
        { name, description, logo, settings },
        req.user.id
      );

      sendResponse({
        res,
        statusCode: 200,
        success: true,
        message: 'Organization updated successfully.',
        data: organization,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/organizations/:organizationId
   * Delete organization (owner only).
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Authentication required.', 401);

      const { organizationId } = req.params;
      await organizationService.delete(organizationId, req.user.id);

      sendResponse({
        res,
        statusCode: 200,
        success: true,
        message: 'Organization deleted successfully.',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/organizations/:organizationId/members
   * List organization members.
   */
  async getMembers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Authentication required.', 401);

      const { organizationId } = req.params;
      const members = await organizationService.getMembers(organizationId, req.user.id);

      sendResponse({
        res,
        statusCode: 200,
        success: true,
        message: 'Organization members retrieved successfully.',
        data: members,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/organizations/:organizationId/invite
   * Invite a member by email.
   */
  async inviteMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Authentication required.', 401);

      const { organizationId } = req.params;
      const { email, role } = req.body;

      await organizationService.inviteMember(organizationId, email, role, req.user.id);

      sendResponse({
        res,
        statusCode: 200,
        success: true,
        message: 'Invitation sent successfully.',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/organizations/join/:token
   * Accept an organization invitation.
   */
  async joinByToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Authentication required.', 401);

      const { token } = req.params;
      const organization = await organizationService.joinByToken(token, req.user.id);

      sendResponse({
        res,
        statusCode: 200,
        success: true,
        message: 'Successfully joined the organization.',
        data: organization,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/organizations/:organizationId/members/:userId
   * Remove a member from the organization.
   */
  async removeMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Authentication required.', 401);

      const { organizationId, userId } = req.params;
      await organizationService.removeMember(organizationId, userId, req.user.id);

      sendResponse({
        res,
        statusCode: 200,
        success: true,
        message: 'Member removed successfully.',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/organizations/:organizationId/members/:userId/role
   * Change a member's role.
   */
  async updateMemberRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Authentication required.', 401);

      const { organizationId, userId } = req.params;
      const { role } = req.body;

      await organizationService.updateMemberRole(organizationId, userId, role, req.user.id);

      sendResponse({
        res,
        statusCode: 200,
        success: true,
        message: 'Member role updated successfully.',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/organizations/:organizationId/transfer
   * Transfer ownership to another member.
   */
  async transferOwnership(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Authentication required.', 401);

      const { organizationId } = req.params;
      const { newOwnerId } = req.body;

      await organizationService.transferOwnership(organizationId, newOwnerId, req.user.id);

      sendResponse({
        res,
        statusCode: 200,
        success: true,
        message: 'Ownership transferred successfully.',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default OrganizationController;
