import { Request, Response, NextFunction } from 'express';
import { TaskService } from '../services/taskService.ts';

export class TaskController {
  // GET /api/tasks
  static async getTasks(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { status, priority, category, search, sortBy, sortOrder } = req.query;

      const result = await TaskService.getTasksForUser(userId, {
        status: status as string,
        priority: priority as string,
        category: category as string,
        search: search as string,
        sortBy: sortBy as any,
        sortOrder: sortOrder as any,
      });

      // Add custom header to indicate cache hit/miss for Task 8 evaluation
      res.setHeader('X-Cache-Status', result.fromCache ? 'HIT' : 'MISS');

      return res.status(200).json({
        success: true,
        cached: result.fromCache,
        count: result.total,
        data: result.tasks,
      });
    } catch (err) {
      next(err);
    }
  }

  // GET /api/tasks/:id
  static async getTaskById(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;

      const task = await TaskService.getTaskById(id, userId);
      if (!task) {
        return res.status(404).json({
          success: false,
          error: 'Not Found',
          message: `Task with ID "${id}" was not found.`,
        });
      }

      return res.status(200).json({
        success: true,
        data: task,
      });
    } catch (err: any) {
      if (err.statusCode === 403) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: err.message,
        });
      }
      next(err);
    }
  }

  // POST /api/tasks
  static async createTask(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { title, description, priority, status, category, deadline } = req.body;

      const newTask = await TaskService.createTask(
        {
          title,
          description,
          priority,
          status,
          category,
          deadline,
        },
        userId
      );

      return res.status(201).json({
        success: true,
        message: 'Task created successfully.',
        data: newTask,
      });
    } catch (err) {
      next(err);
    }
  }

  // PUT /api/tasks/:id
  static async updateTask(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;
      const updateData = req.body;

      const updated = await TaskService.updateTask(id, updateData, userId);
      if (!updated) {
        return res.status(404).json({
          success: false,
          error: 'Not Found',
          message: `Task with ID "${id}" was not found.`,
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Task updated successfully.',
        data: updated,
      });
    } catch (err: any) {
      if (err.statusCode === 403) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: err.message,
        });
      }
      next(err);
    }
  }

  // DELETE /api/tasks/:id
  static async deleteTask(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;

      const success = await TaskService.deleteTask(id, userId);
      if (!success) {
        return res.status(404).json({
          success: false,
          error: 'Not Found',
          message: `Task with ID "${id}" was not found.`,
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Task deleted successfully.',
        data: { id },
      });
    } catch (err: any) {
      if (err.statusCode === 403) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: err.message,
        });
      }
      next(err);
    }
  }

  // GET /api/tasks/stats/summary
  static async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const stats = await TaskService.getDashboardStats(userId);

      return res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (err) {
      next(err);
    }
  }
}
