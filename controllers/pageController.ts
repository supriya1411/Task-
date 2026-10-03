import { Request, Response, NextFunction } from 'express';
import { TaskService } from '../services/taskService.ts';
import { WeatherService } from '../services/weatherService.ts';
import { AuthService } from '../services/authService.ts';
import { getDatabaseStatus } from '../config/db.ts';
import { cacheService } from '../services/cacheService.ts';
import { TaskQueueService } from '../jobs/taskQueue.ts';

export class PageController {
  // GET /
  static renderLanding(req: Request, res: Response) {
    if (res.locals.currentUser) {
      return res.redirect('/dashboard');
    }
    return res.render('pages/landing', {
      title: 'TaskFlow – Full Stack Task Management System',
      page: 'landing',
    });
  }

  // GET /register
  static renderRegister(req: Request, res: Response) {
    if (res.locals.currentUser) {
      return res.redirect('/dashboard');
    }
    return res.render('pages/register', {
      title: 'Create Account – TaskFlow',
      page: 'register',
      errors: [],
      values: {},
    });
  }

  // GET /login
  static renderLogin(req: Request, res: Response) {
    if (res.locals.currentUser) {
      return res.redirect('/dashboard');
    }
    const errorMsg = req.query.error as string;
    const errors = errorMsg ? [{ field: 'credentials', message: errorMsg }] : [];
    return res.render('pages/login', {
      title: 'Sign In – TaskFlow',
      page: 'login',
      errors,
      values: { email: '' },
      registered: req.query.registered === 'true',
      loggedOut: req.query.logout === 'true',
    });
  }

  // GET /dashboard
  static async renderDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const stats = await TaskService.getDashboardStats(user.userId);
      const defaultCity = process.env.WEATHER_DEFAULT_CITY || 'New York';
      const weather = await WeatherService.getWeatherByCity(defaultCity);
      const cacheMetrics = cacheService.getMetrics();
      const recentJobs = TaskQueueService.getUserJobs(user.userId);
      const dbStatus = getDatabaseStatus();

      return res.render('pages/dashboard', {
        title: 'Dashboard – TaskFlow',
        page: 'dashboard',
        user,
        stats,
        weather,
        cacheMetrics,
        recentJobs,
        dbStatus,
      });
    } catch (err) {
      next(err);
    }
  }

  // GET /tasks
  static async renderTasks(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const { status, priority, category, search, sortBy, sortOrder } = req.query;

      const result = await TaskService.getTasksForUser(user.userId, {
        status: status as string,
        priority: priority as string,
        category: category as string,
        search: search as string,
        sortBy: sortBy as any,
        sortOrder: sortOrder as any,
      });

      return res.render('pages/tasks', {
        title: 'Task Management – TaskFlow',
        page: 'tasks',
        user,
        tasks: result.tasks,
        total: result.total,
        fromCache: result.fromCache,
        filters: {
          status: status || 'all',
          priority: priority || 'all',
          category: category || 'all',
          search: search || '',
          sortBy: sortBy || 'createdAt',
          sortOrder: sortOrder || 'desc',
        },
      });
    } catch (err) {
      next(err);
    }
  }

  // GET /tasks/new
  static renderCreateTask(req: Request, res: Response) {
    return res.render('pages/task-form', {
      title: 'Create New Task – TaskFlow',
      page: 'tasks',
      isEdit: false,
      task: {
        title: '',
        description: '',
        priority: 'Medium',
        status: 'Pending',
        category: 'Work',
        deadline: '',
      },
      errors: [],
    });
  }

  // GET /tasks/:id/edit
  static async renderEditTask(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const { id } = req.params;

      const task = await TaskService.getTaskById(id, user.userId);
      if (!task) {
        return res.status(404).render('pages/error', {
          title: 'Task Not Found',
          statusCode: 404,
          message: 'The requested task could not be found or you do not have permission to edit it.',
          page: 'tasks',
        });
      }

      // Format deadline for datetime-local input
      let formattedDeadline = '';
      if (task.deadline) {
        const d = new Date(task.deadline);
        if (!isNaN(d.getTime())) {
          formattedDeadline = d.toISOString().slice(0, 16);
        }
      }

      return res.render('pages/task-form', {
        title: `Edit: ${task.title} – TaskFlow`,
        page: 'tasks',
        isEdit: true,
        task: {
          ...task,
          deadline: formattedDeadline,
        },
        errors: [],
      });
    } catch (err) {
      next(err);
    }
  }

  // GET /profile
  static async renderProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const user = await AuthService.findById(userId);
      const stats = await TaskService.getDashboardStats(userId);
      const dbStatus = getDatabaseStatus();
      const cacheMetrics = cacheService.getMetrics();

      return res.render('pages/profile', {
        title: 'User Profile – TaskFlow',
        page: 'profile',
        user,
        stats,
        dbStatus,
        cacheMetrics,
      });
    } catch (err) {
      next(err);
    }
  }

  // GET /weather
  static async renderWeather(req: Request, res: Response, next: NextFunction) {
    try {
      const city = (req.query.city as string) || process.env.WEATHER_DEFAULT_CITY || 'New York';
      const weather = await WeatherService.getWeatherByCity(city);

      return res.render('pages/weather', {
        title: 'Weather & External API – TaskFlow',
        page: 'weather',
        weather,
        queryCity: city,
      });
    } catch (err) {
      next(err);
    }
  }

  // GET /docs
  static async renderDocs(req: Request, res: Response) {
    const dbStatus = getDatabaseStatus();
    const cacheMetrics = cacheService.getMetrics();

    return res.render('pages/docs', {
      title: 'Internship Tasks 1–8 Documentation & Showcase – TaskFlow',
      page: 'docs',
      dbStatus,
      cacheMetrics,
    });
  }
}
