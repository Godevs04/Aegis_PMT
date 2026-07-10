import { Router } from 'express';
import ProjectController from './project.controller';
import { protect } from '../../middlewares/auth';
import validate from '../../middlewares/validate';
import {
  createProjectSchema,
  getProjectsSchema,
  updateProjectSchema,
  deleteProjectSchema,
} from './project.validation';

const router = Router();
const controller = new ProjectController();

// Protect all project routes
router.use(protect);

router.post('/', validate(createProjectSchema), controller.createProject);
router.get('/', validate(getProjectsSchema), controller.getWorkspaceProjects);
router.patch('/:projectId', validate(updateProjectSchema), controller.updateProject);
router.delete('/:projectId', validate(deleteProjectSchema), controller.deleteProject);

export default router;
