import { Router } from 'express';
import { TaskController } from '../controllers/taskController.ts';
import { requireAuth } from '../middleware/authMiddleware.ts';
import { validateTask } from '../middleware/validationMiddleware.ts';
import { apiRateLimiter } from '../middleware/rateLimitMiddleware.ts';

const router = Router();

// Protect all task API routes with JWT Authentication Middleware (Task 6)
router.use(requireAuth);
router.use(apiRateLimiter);

// Task 5 & Task 8: REST endpoints
router.get('/', TaskController.getTasks);
router.post('/', validateTask, TaskController.createTask);
router.get('/stats/summary', TaskController.getStats);
router.get('/:id', TaskController.getTaskById);
router.put('/:id', validateTask, TaskController.updateTask);
router.delete('/:id', TaskController.deleteTask);

export default router;
