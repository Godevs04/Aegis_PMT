import { Request, Response, NextFunction } from 'express';
import { Permission } from '../config/permissions';
import { permissionService, PermissionContext } from '../modules/roles/permission.service';
import AppError from '../shared/utils/appError';

/**
 * Context extractor function type.
 * Extracts organizationId, workspaceId, and/or projectId from the request.
 */
export type ContextExtractor = (req: Request) => PermissionContext;

// ─── Built-in Context Extractors ─────────────────────────────────────────────

/**
 * Extracts workspaceId from req.params.workspaceId
 */
export const workspaceFromParams: ContextExtractor = (req) => ({
  workspaceId: req.params.workspaceId,
});

/**
 * Extracts workspaceId from req.body.workspaceId
 */
export const workspaceFromBody: ContextExtractor = (req) => ({
  workspaceId: req.body.workspaceId,
});

/**
 * Extracts workspaceId from req.query.workspaceId
 */
export const workspaceFromQuery: ContextExtractor = (req) => ({
  workspaceId: req.query.workspaceId as string,
});

/**
 * Extracts projectId from req.params.projectId
 */
export const projectFromParams: ContextExtractor = (req) => ({
  projectId: req.params.projectId,
  workspaceId: req.params.workspaceId,
});

/**
 * Extracts projectId from req.body.projectId and workspaceId from body
 */
export const projectFromBody: ContextExtractor = (req) => ({
  projectId: req.body.projectId,
  workspaceId: req.body.workspaceId,
});

/**
 * Extracts organizationId from req.params.organizationId
 */
export const organizationFromParams: ContextExtractor = (req) => ({
  organizationId: req.params.organizationId,
});

// ─── Authorize Middleware Factory ────────────────────────────────────────────

/**
 * authorize — Primary permission-checking middleware.
 *
 * Usage:
 *   router.post('/tasks', protect, authorize('task:create', workspaceFromBody), controller.create)
 *   router.delete('/tasks/:id', protect, authorize('task:delete', workspaceFromParams), controller.delete)
 *
 * @param permission - The permission string required (e.g., 'task:create')
 * @param contextExtractor - Function to extract context IDs from the request
 */
export const authorize = (
  permission: Permission,
  contextExtractor: ContextExtractor
) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        return next(new AppError('Authentication required.', 401));
      }

      const context = contextExtractor(req);

      // Validate that at least one context ID was extracted
      if (!context.organizationId && !context.workspaceId && !context.projectId) {
        return next(
          new AppError('Unable to determine authorization context from request.', 400)
        );
      }

      const hasAccess = await permissionService.hasPermission(
        req.user.id,
        permission,
        context
      );

      if (!hasAccess) {
        return next(
          new AppError('You do not have permission to perform this action.', 403)
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * authorizeAny — Requires ANY of the provided permissions.
 *
 * Usage:
 *   router.patch('/tasks/:id', protect, authorizeAny(['task:update', 'task:manage_status'], workspaceFromParams), ...)
 */
export const authorizeAny = (
  permissions: Permission[],
  contextExtractor: ContextExtractor
) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        return next(new AppError('Authentication required.', 401));
      }

      const context = contextExtractor(req);

      if (!context.organizationId && !context.workspaceId && !context.projectId) {
        return next(
          new AppError('Unable to determine authorization context from request.', 400)
        );
      }

      const hasAccess = await permissionService.hasAnyPermission(
        req.user.id,
        permissions,
        context
      );

      if (!hasAccess) {
        return next(
          new AppError('You do not have permission to perform this action.', 403)
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// ─── Membership-Only Middlewares ──────────────────────────────────────────────

/**
 * requireWorkspaceMember — Only checks that the user is a member of the workspace.
 * Does NOT check specific permissions. Use for read-heavy routes where any member can access.
 *
 * Usage:
 *   router.get('/tasks', protect, requireWorkspaceMember(workspaceFromQuery), controller.list)
 */
export const requireWorkspaceMember = (contextExtractor: ContextExtractor) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        return next(new AppError('Authentication required.', 401));
      }

      const context = contextExtractor(req);

      if (!context.workspaceId) {
        return next(new AppError('Workspace ID is required.', 400));
      }

      const isMember = await permissionService.isWorkspaceMember(
        req.user.id,
        context.workspaceId
      );

      if (!isMember) {
        return next(
          new AppError('Access denied. You are not a member of this workspace.', 403)
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * requireProjectMember — Checks that the user has access to the project.
 * A user has access if they are a direct ProjectMember OR a WorkspaceMember of the parent workspace.
 *
 * Usage:
 *   router.get('/projects/:projectId', protect, requireProjectMember(projectFromParams), controller.get)
 */
export const requireProjectMember = (contextExtractor: ContextExtractor) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        return next(new AppError('Authentication required.', 401));
      }

      const context = contextExtractor(req);

      if (!context.projectId) {
        return next(new AppError('Project ID is required.', 400));
      }

      const isMember = await permissionService.isProjectMember(
        req.user.id,
        context.projectId,
        context.workspaceId
      );

      if (!isMember) {
        return next(
          new AppError('Access denied. You do not have access to this project.', 403)
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
