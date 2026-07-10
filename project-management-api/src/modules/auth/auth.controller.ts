import { Request, Response, NextFunction } from 'express';
import AuthService from './auth.service';
import sendResponse from '../../shared/utils/response';
import AppError from '../../shared/utils/appError';

const authService = new AuthService();

// Helper to configure refresh token cookie options
const getCookieOptions = (rememberMe = false) => {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: (isProd ? 'none' : 'lax') as 'none' | 'lax',
    maxAge: rememberMe
      ? 30 * 24 * 60 * 60 * 1000 // 30 days
      : 24 * 60 * 60 * 1000, // 1 day
  };
};

export class AuthController {
  /**
   * Register User
   */
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, email, password } = req.body;
      const user = await authService.register(name, email, password);

      sendResponse({
        res,
        statusCode: 201,
        success: true,
        message: 'Registration successful. Please check your email to verify your account.',
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Login User
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password, rememberMe } = req.body;
      const { user, accessToken, refreshToken } = await authService.login(email, password);

      // Set Refresh Token in secure HTTP-only cookie
      res.cookie('refreshToken', refreshToken, getCookieOptions(rememberMe));

      sendResponse({
        res,
        statusCode: 200,
        success: true,
        message: 'Login successful',
        data: {
          accessToken,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logout User
   */
  async logout(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Clear Cookie
      res.clearCookie('refreshToken', getCookieOptions());

      sendResponse({
        res,
        statusCode: 200,
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verify Email
   */
  async verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = req.query.token as string;
      await authService.verifyEmail(token);

      sendResponse({
        res,
        statusCode: 200,
        success: true,
        message: 'Email address verified successfully. You can now log in.',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Forgot Password
   */
  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;
      await authService.forgotPassword(email);

      sendResponse({
        res,
        statusCode: 200,
        success: true,
        message: 'If the email matches a registered account, a password reset link has been sent.',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reset Password
   */
  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = req.query.token as string;
      const { password } = req.body;
      await authService.resetPassword(token, password);

      sendResponse({
        res,
        statusCode: 200,
        success: true,
        message: 'Password reset successfully. You can now log in with your new password.',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Refresh Access & Refresh Tokens
   */
  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = req.cookies?.refreshToken;
      if (!token) {
        throw new AppError('Refresh token missing from request cookies.', 401);
      }

      const { accessToken, refreshToken } = await authService.refreshTokens(token);

      // Rotate cookie with new refresh token
      res.cookie('refreshToken', refreshToken, getCookieOptions(true));

      sendResponse({
        res,
        statusCode: 200,
        success: true,
        message: 'Tokens refreshed successfully',
        data: { accessToken },
      });
    } catch (error) {
      next(error);
    }
  }
}

export default AuthController;
