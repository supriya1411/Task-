import { Router, Request, Response, NextFunction } from 'express';
import { PageController } from '../controllers/pageController.ts';
import { AuthController } from '../controllers/authController.ts';
import { requireAuth, optionalAuth } from '../middleware/authMiddleware.ts';
import { validateRegistration, validateLogin, validateTask } from '../middleware/validationMiddleware.ts';
import { TaskService } from '../services/taskService.ts';

const router = Router();

// Apply optionalAuth across all page routes to make user data accessible to templates
router.use(optionalAuth);

// Landing
router.get('/', PageController.renderLanding);

// Auth Pages (Task 1 & Task 6)
router.get('/register', PageController.renderRegister);
router.post('/register', validateRegistration, AuthController.register);

router.get('/login', PageController.renderLogin);
router.post('/login', validateLogin, AuthController.login);

router.get('/logout', AuthController.logout);
router.post('/logout', AuthController.logout);

// Protected Dashboard (Task 3)
router.get('/dashboard', requireAuth, PageController.renderDashboard);

// Protected Tasks Management (Task 1, 3, 4, 5, 6, 8)
router.get('/tasks', requireAuth, PageController.renderTasks);
router.get('/tasks/new', requireAuth, PageController.renderCreateTask);
router.get('/tasks/:id/edit', requireAuth, PageController.renderEditTask);

// HTML Form Submissions for Tasks
router.post('/tasks', requireAuth, validateTask, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { title, description, priority, status, category, deadline } = req.body;
    await TaskService.createTask(
      { title, description, priority, status, category, deadline },
      userId
    );
    res.redirect('/tasks?created=true');
  } catch (err) {
    next(err);
  }
});

router.post('/tasks/:id', requireAuth, validateTask, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const { title, description, priority, status, category, deadline } = req.body;
    await TaskService.updateTask(
      id,
      { title, description, priority, status, category, deadline },
      userId
    );
    res.redirect('/tasks?updated=true');
  } catch (err) {
    next(err);
  }
});

router.post('/tasks/:id/delete', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    await TaskService.deleteTask(id, userId);
    res.redirect('/tasks?deleted=true');
  } catch (err) {
    next(err);
  }
});

// Profile & Settings
router.get('/profile', requireAuth, PageController.renderProfile);

// External Weather Section (Task 7)
router.get('/weather', PageController.renderWeather);

// Interactive Internship Tasks 1–8 Documentation & Showcase
router.get('/docs', PageController.renderDocs);

export default router;
