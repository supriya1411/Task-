import { TaskModel, taskMemoryRepo, ITask } from '../models/Task.ts';
import { getDatabaseStatus } from '../config/db.ts';
import { cacheService } from './cacheService.ts';

export interface TaskFilterOptions {
  status?: string;
  priority?: string;
  category?: string;
  search?: string;
  sortBy?: 'createdAt' | 'deadline' | 'priority' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export class TaskService {
  private static getRepo() {
    const status = getDatabaseStatus();
    return status.type === 'mongodb' ? TaskModel : taskMemoryRepo;
  }

  static async getTasksForUser(
    userId: string,
    filters: TaskFilterOptions = {}
  ): Promise<{ tasks: any[]; fromCache: boolean; total: number }> {
    // Generate deterministic cache key based on query filters
    const queryKey = `tasks:${userId}:list:${JSON.stringify(filters)}`;

    // Task 8: Check Cache first
    const cachedData = await cacheService.get<{ tasks: any[]; total: number }>(queryKey);
    if (cachedData) {
      return {
        tasks: cachedData.tasks,
        total: cachedData.total,
        fromCache: true,
      };
    }

    const repo = this.getRepo();
    const query: any = { userId };

    if (filters.status && filters.status !== 'all') {
      query.status = filters.status;
    }
    if (filters.priority && filters.priority !== 'all') {
      query.priority = filters.priority;
    }
    if (filters.category && filters.category !== 'all') {
      query.category = filters.category;
    }
    if (filters.search && filters.search.trim()) {
      const q = filters.search.trim();
      if (getDatabaseStatus().type === 'mongodb') {
        query.$or = [
          { title: { $regex: q, $options: 'i' } },
          { description: { $regex: q, $options: 'i' } },
        ];
      } else {
        query.search = q;
      }
    }

    let tasks = await repo.find(query);

    // Ensure array of plain objects
    tasks = tasks.map((t: any) => (typeof t.toObject === 'function' ? t.toObject() : t));

    // Client-side sorting logic if needed
    const sortBy = filters.sortBy || 'createdAt';
    const sortOrder = filters.sortOrder === 'asc' ? 1 : -1;

    tasks.sort((a: any, b: any) => {
      if (sortBy === 'deadline') {
        const dateA = a.deadline ? new Date(a.deadline).getTime() : 0;
        const dateB = b.deadline ? new Date(b.deadline).getTime() : 0;
        return (dateA - dateB) * sortOrder;
      }
      if (sortBy === 'priority') {
        const orderMap: Record<string, number> = { Urgent: 4, High: 3, Medium: 2, Low: 1 };
        const pA = orderMap[a.priority] || 0;
        const pB = orderMap[b.priority] || 0;
        return (pA - pB) * sortOrder;
      }
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title) * sortOrder;
      }
      const timeA = new Date(a.createdAt || 0).getTime();
      const timeB = new Date(b.createdAt || 0).getTime();
      return (timeA - timeB) * sortOrder;
    });

    const result = {
      tasks,
      total: tasks.length,
    };

    // Task 8: Save to Cache (180s TTL)
    await cacheService.set(queryKey, result, 180);

    return {
      tasks: result.tasks,
      total: result.total,
      fromCache: false,
    };
  }

  static async getTaskById(taskId: string, userId: string): Promise<any | null> {
    const repo = this.getRepo();
    const task = await repo.findById(taskId);

    if (!task) {
      return null;
    }

    const doc = typeof task.toObject === 'function' ? task.toObject() : task;

    // Task 6: Authorization check - A user must only be able to access their own tasks
    if (doc.userId !== userId) {
      const authErr: any = new Error('Forbidden: You are not authorized to view this task.');
      authErr.statusCode = 403;
      throw authErr;
    }

    return doc;
  }

  static async createTask(data: Partial<ITask>, userId: string): Promise<any> {
    const repo = this.getRepo();

    const created = await repo.create({
      title: data.title!,
      description: data.description || '',
      priority: data.priority || 'Medium',
      status: data.status || 'Pending',
      category: data.category || 'Work',
      deadline: data.deadline ? new Date(data.deadline) : undefined,
      userId,
    });

    const doc = typeof created.toObject === 'function' ? created.toObject() : created;

    // Task 8: Invalidate cache when tasks are created
    await cacheService.invalidateUserTasks(userId);

    return doc;
  }

  static async updateTask(taskId: string, updateData: Partial<ITask>, userId: string): Promise<any> {
    const repo = this.getRepo();
    const existing = await repo.findById(taskId);

    if (!existing) {
      return null;
    }

    const doc = typeof existing.toObject === 'function' ? existing.toObject() : existing;

    // Task 6: Authorization check
    if (doc.userId !== userId) {
      const authErr: any = new Error('Forbidden: You are not authorized to modify this task.');
      authErr.statusCode = 403;
      throw authErr;
    }

    const updated = await repo.findByIdAndUpdate(taskId, updateData, { new: true });
    const resultDoc = typeof updated.toObject === 'function' ? updated.toObject() : updated;

    // Task 8: Invalidate cache when tasks are updated
    await cacheService.invalidateUserTasks(userId);

    return resultDoc;
  }

  static async deleteTask(taskId: string, userId: string): Promise<boolean> {
    const repo = this.getRepo();
    const existing = await repo.findById(taskId);

    if (!existing) {
      return false;
    }

    const doc = typeof existing.toObject === 'function' ? existing.toObject() : existing;

    // Task 6: Authorization check
    if (doc.userId !== userId) {
      const authErr: any = new Error('Forbidden: You are not authorized to delete this task.');
      authErr.statusCode = 403;
      throw authErr;
    }

    await repo.findByIdAndDelete(taskId);

    // Task 8: Invalidate cache when tasks are deleted
    await cacheService.invalidateUserTasks(userId);

    return true;
  }

  static async getDashboardStats(userId: string) {
    const repo = this.getRepo();
    let allTasks = await (repo as any).find({ userId });
    allTasks = allTasks.map((t: any) => (typeof t.toObject === 'function' ? t.toObject() : t));

    const total = allTasks.length;
    const completed = allTasks.filter((t: any) => t.status === 'Completed').length;
    const inProgress = allTasks.filter((t: any) => t.status === 'In Progress').length;
    const pending = allTasks.filter((t: any) => t.status === 'Pending').length;
    const highPriority = allTasks.filter((t: any) => t.priority === 'High' || t.priority === 'Urgent').length;

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Sort by createdAt descending for recent tasks
    const recentTasks = [...allTasks]
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, 5);

    // Group by category
    const categories: Record<string, number> = {};
    for (const t of allTasks) {
      const cat = t.category || 'Other';
      categories[cat] = (categories[cat] || 0) + 1;
    }

    return {
      total,
      completed,
      inProgress,
      pending,
      highPriority,
      completionRate,
      recentTasks,
      categories,
    };
  }
}
