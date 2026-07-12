import { Router } from 'express';
import RoleController from './role.controller';
import { protect } from '../../middlewares/auth';

const router = Router();
const controller = new RoleController();

// All role routes require authentication
router.use(protect);

// Get all system roles (public to authenticated users for dropdowns, etc.)
router.get('/system', controller.getSystemRoles);

// Get a specific role by ID
router.get('/:id', controller.getRoleById);

export default router;
