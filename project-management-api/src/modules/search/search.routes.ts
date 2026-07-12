import { Router } from 'express';
import SearchController from './search.controller';
import { protect } from '../../middlewares/auth';

const router = Router();
const controller = new SearchController();

router.use(protect);

// Global search
router.get('/', controller.search);

export default router;
