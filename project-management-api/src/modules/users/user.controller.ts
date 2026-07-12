import { Request, Response, NextFunction } from 'express';
import UserRepository from './user.repository';
import AppError from '../../shared/utils/appError';
import sendResponse from '../../shared/utils/response';
import { uploadToCloudinary } from '../../services/upload.service';
import User from './user.model';
import { OrganizationMember } from '../members/organization-member.model';

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

      const { name } = req.body;
      if (name) {
        user.name = name;
      }

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
   */
  async getOnboardingStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Authentication required.', 401);

      // Check if user has any organization memberships
      const orgMemberships = await OrganizationMember.find({
        userId: req.user.id,
        status: 'active',
      }).select('organizationId');

      const hasOrganization = orgMemberships.length > 0;

      sendResponse({
        res,
        statusCode: 200,
        success: true,
        message: 'Onboarding status retrieved successfully.',
        data: {
          isOnboardingComplete: req.user.isOnboardingComplete,
          onboardingStep: req.user.onboardingStep || 0,
          hasOrganization,
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

      // Mark onboarding profile step as complete
      user.isOnboardingComplete = true;
      user.onboardingStep = 1;

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
