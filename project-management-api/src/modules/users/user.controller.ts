import { Request, Response, NextFunction } from 'express';
import UserRepository from './user.repository';
import AppError from '../../shared/utils/appError';
import sendResponse from '../../shared/utils/response';
import { uploadToCloudinary } from '../../services/upload.service';
import User from './user.model';
import { OrganizationMember } from '../members/organization-member.model';
import { WorkspaceMember } from '../members/workspace-member.model';
import { Organization } from '../organizations/organization.model';
import { Workspace } from '../workspaces/workspace.model';
import { Role } from '../roles/role.model';
import { SystemRole } from '../../config/permissions';

const userRepository = new UserRepository();

export class UserController {
  /**
   * Get Current Authenticated User profile
   */
  async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('Authentication credentials not found', 401);
      }

      sendResponse({
        res,
        statusCode: 200,
        success: true,
        message: 'Profile retrieved successfully',
        data: {
          id: req.user.id,
          name: req.user.name,
          email: req.user.email,
          role: req.user.role,
          avatarUrl: req.user.avatarUrl,
          bio: req.user.bio,
          timezone: req.user.timezone,
          language: req.user.language,
          theme: req.user.theme,
          isOnboardingComplete: req.user.isOnboardingComplete,
          onboardingStep: req.user.onboardingStep,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update Profile Details and Avatar
   */
  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        throw new AppError('Authentication credentials not found', 401);
      }

      const { name, bio, timezone, language, theme } = req.body;
      if (name) user.name = name;
      if (bio !== undefined) user.bio = bio;
      if (timezone !== undefined) user.timezone = timezone;
      if (language !== undefined) user.language = language;
      if (theme !== undefined) user.theme = theme;

      // Handle file upload if present in buffer
      if (req.file) {
        const folder = `aegis/avatars/${user.id}`;
        const avatarUrl = await uploadToCloudinary(req.file.buffer, folder);
        user.avatarUrl = avatarUrl;
      }

      await userRepository.save(user);

      sendResponse({
        res,
        statusCode: 200,
        success: true,
        message: 'Profile updated successfully',
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatarUrl: user.avatarUrl,
          bio: user.bio,
          timezone: user.timezone,
          language: user.language,
          theme: user.theme,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update Password
   */
  async updatePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        throw new AppError('Authentication credentials not found', 401);
      }

      const { currentPassword, newPassword } = req.body;

      // Find user with password selected for verification
      const userWithPass = await User.findById(user.id).select('+password');
      if (!userWithPass || !(await userWithPass.comparePassword(currentPassword))) {
        throw new AppError('Invalid current password provided.', 400);
      }

      userWithPass.password = newPassword;
      // Invalidate current refresh tokens so all devices must log in again with new password
      userWithPass.tokenVersion += 1;

      await userRepository.save(userWithPass);

      sendResponse({
        res,
        statusCode: 200,
        success: true,
        message: 'Password updated successfully. Please log in again.',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Search Users by name or email (e.g. for inviting/assigning tasks)
   */
  async searchUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = req.query.q as string;
      if (!query || query.trim().length < 2) {
        throw new AppError('Query parameter "q" must be at least 2 characters.', 400);
      }

      // Search using partial regex match on name or email
      const regex = new RegExp(query, 'i');
      const users = await User.find({
        $or: [{ name: regex }, { email: regex }],
        deletedAt: null, // Only non-deleted users
      })
        .select('name email role avatarUrl')
        .limit(15);

      sendResponse({
        res,
        statusCode: 200,
        success: true,
        message: 'Users fetched successfully',
        data: users,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Soft Delete account
   */
  async deleteMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        throw new AppError('Authentication credentials not found', 401);
      }

      await user.softDelete(user.id);

      // Clear cookies if logged in via session
      res.clearCookie('refreshToken');

      sendResponse({
        res,
        statusCode: 200,
        success: true,
        message: 'Your account has been deleted successfully.',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /users/onboarding-status
   * Returns the user's onboarding state and what step they're on.
   *
   * Repairs legacy gaps where the user owns orgs / has workspace memberships
   * but is missing OrganizationMember rows (which previously caused endless
   * onboarding redirects on every login).
   */
  async getOnboardingStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Authentication required.', 401);

      const userId = req.user.id;
      let membershipCount = await OrganizationMember.countDocuments({
        userId,
        status: 'active',
        deletedAt: null,
      });

      // Repair: owned organizations without membership
      if (membershipCount === 0) {
        const ownedOrgs = await Organization.find({ ownerId: userId, deletedAt: null });
        const ownerRole = await Role.findOne({ slug: SystemRole.ORG_OWNER, isSystem: true });
        if (ownerRole && ownedOrgs.length > 0) {
          for (const org of ownedOrgs) {
            await OrganizationMember.updateOne(
              { userId, organizationId: org.id },
              {
                $set: {
                  status: 'active',
                  deletedAt: null,
                  roleId: ownerRole.id,
                  updatedBy: userId,
                },
                $setOnInsert: {
                  joinedAt: new Date(),
                  createdBy: userId,
                },
              },
              { upsert: true }
            );
          }
          membershipCount = await OrganizationMember.countDocuments({
            userId,
            status: 'active',
            deletedAt: null,
          });
        }
      }

      // Repair: has workspace membership but no org membership (workspace-create path)
      if (membershipCount === 0) {
        const wsMemberships = await WorkspaceMember.find({
          userId,
          status: 'active',
        }).select('workspaceId');

        if (wsMemberships.length > 0) {
          const workspaceIds = wsMemberships.map((m) => m.workspaceId);
          const workspaces = await Workspace.find({ _id: { $in: workspaceIds } }).select(
            'organizationId'
          );
          const orgIds = [...new Set(workspaces.map((w) => w.organizationId.toString()))];
          const ownerRole = await Role.findOne({ slug: SystemRole.ORG_OWNER, isSystem: true });
          const developerRole = await Role.findOne({
            slug: SystemRole.DEVELOPER,
            isSystem: true,
          });

          for (const orgId of orgIds) {
            const org = await Organization.findById(orgId);
            if (!org) continue;
            const isOwner = org.ownerId.toString() === userId;
            const role = isOwner ? ownerRole : developerRole;
            if (!role) continue;
            await OrganizationMember.updateOne(
              { userId, organizationId: orgId },
              {
                $set: {
                  status: 'active',
                  deletedAt: null,
                  roleId: role.id,
                  updatedBy: userId,
                },
                $setOnInsert: {
                  joinedAt: new Date(),
                  createdBy: userId,
                },
              },
              { upsert: true }
            );
          }

          membershipCount = await OrganizationMember.countDocuments({
            userId,
            status: 'active',
            deletedAt: null,
          });
        }
      }

      const hasOrganization = membershipCount > 0;
      const onboardingStep = Math.max(req.user.onboardingStep || 0, hasOrganization ? 2 : 0);

      // Profile step is done if they already finished it OR already have an org
      const profileComplete =
        onboardingStep >= 1 || !!req.user.isOnboardingComplete || hasOrganization;

      // Fully onboarded = has an organization (profile alone is not enough)
      const isFullyOnboarded = hasOrganization;

      if (
        hasOrganization &&
        (!req.user.isOnboardingComplete || (req.user.onboardingStep || 0) < 2)
      ) {
        req.user.isOnboardingComplete = true;
        req.user.onboardingStep = 2;
        await req.user.save();
      } else if (profileComplete && !hasOrganization && (req.user.onboardingStep || 0) < 1) {
        req.user.onboardingStep = 1;
        await req.user.save();
      }

      sendResponse({
        res,
        statusCode: 200,
        success: true,
        message: 'Onboarding status retrieved successfully.',
        data: {
          // Keep legacy meaning for clients: profile step finished
          isOnboardingComplete: profileComplete,
          isFullyOnboarded,
          onboardingStep: hasOrganization ? 2 : profileComplete ? 1 : 0,
          hasOrganization,
          needsProfile: !profileComplete,
          needsOrganization: !hasOrganization,
          profile: {
            name: req.user.name,
            bio: req.user.bio,
            avatarUrl: req.user.avatarUrl,
            timezone: req.user.timezone,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /users/complete-profile
   * Complete the user profile during onboarding.
   * Accepts: name, bio, timezone, language, avatar (file)
   * Sets isOnboardingComplete = true
   */
  async completeProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) throw new AppError('Authentication required.', 401);

      const { name, bio, timezone, language } = req.body;

      if (name) user.name = name;
      if (bio !== undefined) user.bio = bio;
      if (timezone) user.timezone = timezone;
      if (language) user.language = language;

      // Handle avatar upload
      if (req.file) {
        const folder = `aegis/avatars/${user.id}`;
        const avatarUrl = await uploadToCloudinary(req.file.buffer, folder);
        user.avatarUrl = avatarUrl;
      }

      // Profile step done — fully complete only after organization
      user.onboardingStep = Math.max(user.onboardingStep || 0, 1);
      // Keep true for backward compat with older clients, but org step still required
      if (!user.isOnboardingComplete) {
        user.isOnboardingComplete = true;
      }

      await userRepository.save(user);

      sendResponse({
        res,
        statusCode: 200,
        success: true,
        message: 'Profile completed successfully.',
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatarUrl: user.avatarUrl,
          bio: user.bio,
          timezone: user.timezone,
          language: user.language,
          theme: user.theme,
          isOnboardingComplete: user.isOnboardingComplete,
          onboardingStep: user.onboardingStep,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export default UserController;
