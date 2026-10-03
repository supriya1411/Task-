import { Router } from 'express';
import { JobController } from '../controllers/jobController.ts';
import { requireAuth } from '../middleware/authMiddleware.ts';

const router = Router();

router.use(requireAuth);

router.post('/', JobController.triggerJob);
router.get('/', JobController.getUserJobs);
router.get('/:id', JobController.getJobStatus);

export default router;
