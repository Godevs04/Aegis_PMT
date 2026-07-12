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
  addProjectMemberSchema,
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

// List projects — requires workspace membership
router.get(
  '/',
  validate(getProjectsSchema),
  requireWorkspaceMember(workspaceFromQuery),
  controller.getWorkspaceProjects
);

// Get single project — membership checked in service
router.get('/:projectId', controller.getProject);

// Update project — membership checked in service
router.patch('/:projectId', validate(updateProjectSchema), controller.updateProject);

// Archive project
router.post('/:projectId/archive', controller.archiveProject);

// Restore project
router.post('/:projectId/restore', controller.restoreProject);

// Delete project
router.delete('/:projectId', validate(deleteProjectSchema), controller.deleteProject);

// Project analytics
router.get('/:projectId/analytics', controller.getAnalytics);

// Project members
router.get('/:projectId/members', controller.getMembers);
router.post('/:projectId/members', validate(addProjectMemberSchema), controller.addMember);
router.delete('/:projectId/members/:userId', controller.removeMember);

export default router;
