import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import UserRepository from '../modules/users/user.repository';
import AppError from '../shared/utils/appError';
import { UserRole, Permission, ROLE_PERMISSIONS } from '../config/roles';

interface TokenPayload {
  userId: string;
  role?: string;
  tokenVersion: number;
}

const userRepository = new UserRepository();

/**
 * Middleware: Verify access token (JWT)
 */
export const protect = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token = '';

    // 1. Get token from authorization headers
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.accessToken) {
      // 2. Or fallback to cookies if available
      token = req.cookies.accessToken;
    }

    if (!token) {
      return next(new AppError('You are not logged in. Please log in to gain access.', 401));
    }

    // 3. Verify token
    let decoded: TokenPayload;
    try {
      decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'dev_jwt_access_secret_key'
      ) as TokenPayload;
    } catch {
      return next(new AppError('Invalid token or expired. Please sign in again.', 401));
    }

    // 4. Check if user still exists
    const user = await userRepository.findById(decoded.userId);
    if (!user) {
      return next(new AppError('The user belonging to this token no longer exists.', 401));
    }

    // 5. Verify refresh token version matches user to verify logout/revocation didn't happen
    if (decoded.tokenVersion !== user.tokenVersion) {
      return next(new AppError('Token version mismatch. Session is invalid.', 401));
    }

    // 6. Grant Access and attach User to Request
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * @deprecated Use the new `authorize` middleware from Task 2 (permission.service.ts) instead.
 * Kept temporarily for backward compatibility during migration.
 *
 * Middleware: Restrict access to specific roles (legacy — uses User.role field)
 */
export const restrictTo = (...roles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    const userRole = req.user.role as UserRole | undefined;
    if (!userRole || !roles.includes(userRole)) {
      return next(new AppError('You do not have permission to perform this action.', 403));
    }

    next();
  };
};

/**
 * @deprecated Use the new `authorize` middleware from Task 2 (permission.service.ts) instead.
 * Kept temporarily for backward compatibility during migration.
 *
 * Middleware: Require specific permission based on Role Permissions configuration (legacy)
 */
export const requirePermission = (permission: Permission) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    const userRole = req.user.role as UserRole | undefined;
    if (!userRole) {
      return next(new AppError('You do not have the required permissions for this resource.', 403));
    }

    const userPermissions = ROLE_PERMISSIONS[userRole] || [];
    if (!userPermissions.includes(permission)) {
      return next(new AppError('You do not have the required permissions for this resource.', 403));
    }

    next();
  };
};
