import { Request, Response, NextFunction } from 'express';
import { TaskQueueService } from '../jobs/taskQueue.ts';
import { TaskService } from '../services/taskService.ts';

export class JobController {
  // POST /api/jobs
  static async triggerJob(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { type } = req.body;

      const allowedTypes = ['GENERATE_SUMMARY_REPORT', 'TASK_DUE_REMINDER', 'EXPORT_TASKS_CSV'];
      if (!type || !allowedTypes.includes(type)) {
        return res.status(400).json({
          success: false,
          error: 'Bad Request',
          message: `Invalid job type. Must be one of: ${allowedTypes.join(', ')}`,
        });
      }

      // Fetch user's current tasks to supply job payload
      const { tasks } = await TaskService.getTasksForUser(userId);
      const job = await TaskQueueService.addJob(type, userId, {
        tasks,
        userName: req.user?.name || 'User',
      });

      return res.status(202).json({
        success: true,
        message: `Background job "${type}" has been scheduled.`,
        data: { job },
      });
    } catch (err) {
      next(err);
    }
  }

  // GET /api/jobs/:id
  static async getJobStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const job = TaskQueueService.getJobById(id);

      if (!job) {
        return res.status(404).json({
          success: false,
          error: 'Not Found',
          message: `Background job with ID "${id}" was not found.`,
        });
      }

      return res.status(200).json({
        success: true,
        data: { job },
      });
    } catch (err) {
      next(err);
    }
  }

  // GET /api/jobs
  static async getUserJobs(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const jobs = TaskQueueService.getUserJobs(userId);

      return res.status(200).json({
        success: true,
        data: { jobs },
      });
    } catch (err) {
      next(err);
    }
  }
}
