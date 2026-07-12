import { Router } from 'express';
import AttachmentController from './attachment.controller';
import { protect } from '../../middlewares/auth';
import { requireWorkspaceMember, workspaceFromBody } from '../../middlewares/authorize';
import { fileUploadParser } from '../../services/upload.service';

const router = Router();
const controller = new AttachmentController();

// All attachment routes require authentication
router.use(protect);

// Upload attachment — requires workspace membership (checked via body.workspaceId)
router.post(
  '/',
  fileUploadParser.single('file'),
  requireWorkspaceMember(workspaceFromBody),
  controller.upload
);

// List attachments by entity
router.get('/', controller.listByEntity);

// List all workspace attachments
router.get('/workspace/:workspaceId', controller.listByWorkspace);

// Get storage usage for workspace
router.get('/usage/:workspaceId', controller.getStorageUsage);

// Get single attachment
router.get('/:attachmentId', controller.getById);

// Delete attachment
router.delete('/:attachmentId', controller.delete);

export default router;
