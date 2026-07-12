import { Router } from 'express';
import ProjectController from './project.controller';
import { protect } from '../../middlewares/auth';
import {
  authorize,
  requireWorkspaceMember,
  workspaceFromBody,
  workspaceFromQuery,
} from '../../middlewares/authorize';
import { ProjectPermissions } from '../../config/permissions';
import validate from '../../middlewares/validate';
import {
  createProjectSchema,
  getProjectsSchema,
  updateProjectSchema,
  deleteProjectSchema,
} from './project.validation';

const router = Router();
const controller = new ProjectController();

// All project routes require authentication
router.use(protect);

// Create project — requires project:create permission in the workspace
router.post(
  '/',
  validate(createProjectSchema),
  authorize(ProjectPermissions.CREATE, workspaceFromBody),
  controller.createProject
);

// List projects — requires workspace membership (any member can list)
router.get(
  '/',
  validate(getProjectsSchema),
  requireWorkspaceMember(workspaceFromQuery),
  controller.getWorkspaceProjects
);

// Update project — permission check handled in service (loads project → resolves workspaceId → checks membership)
router.patch(
  '/:projectId',
  validate(updateProjectSchema),
  controller.updateProject
);

// Delete project — permission check handled in service (loads project → resolves workspaceId → checks membership)
router.delete(
  '/:projectId',
  validate(deleteProjectSchema),
  controller.deleteProject
);

export default router;
