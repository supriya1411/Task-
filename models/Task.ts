import mongoose, { Schema, Document } from 'mongoose';

export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type TaskStatus = 'Pending' | 'In Progress' | 'Completed';
export type TaskCategory = 'Work' | 'Personal' | 'Study' | 'Health' | 'Finance' | 'Other';

export interface ITask {
  _id?: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  category: TaskCategory;
  deadline?: Date | string;
  userId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ITaskDocument extends Document, Omit<ITask, '_id'> {}

const TaskSchema = new Schema<ITaskDocument>(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      default: '',
    },
    priority: {
      type: String,
      enum: {
        values: ['Low', 'Medium', 'High', 'Urgent'],
        message: '{VALUE} is not a valid priority',
      },
      default: 'Medium',
    },
    status: {
      type: String,
      enum: {
        values: ['Pending', 'In Progress', 'Completed'],
        message: '{VALUE} is not a valid status',
      },
      default: 'Pending',
    },
    category: {
      type: String,
      enum: ['Work', 'Personal', 'Study', 'Health', 'Finance', 'Other'],
      default: 'Work',
    },
    deadline: {
      type: Date,
      default: null,
    },
    userId: {
      type: String,
      required: [true, 'User ID is required for task ownership'],
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for querying user's tasks ordered by deadline or creation
TaskSchema.index({ userId: 1, createdAt: -1 });
TaskSchema.index({ userId: 1, status: 1 });
TaskSchema.index({ userId: 1, priority: 1 });

export const TaskModel = mongoose.models.Task || mongoose.model<ITaskDocument>('Task', TaskSchema);

// In-Memory Repository for seamless fallback and testing
class TaskMemoryRepository {
  private tasks: (ITask & { _id: string; createdAt: Date; updatedAt: Date })[] = [];

  constructor() {
    this.seedDefaultTasks();
  }

  private seedDefaultTasks() {
    const now = new Date();
    const futureDate = (days: number) => new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const demoTasks: (ITask & { _id: string; createdAt: Date; updatedAt: Date })[] = [
      {
        _id: 'task_001',
        title: 'Complete Cognifyz Full Stack Project Report',
        description: 'Compile architectural diagrams, screenshots for Task 1 through 8, API documentation, and performance benchmarks.',
        priority: 'Urgent',
        status: 'In Progress',
        category: 'Work',
        deadline: futureDate(2),
        userId: 'user_demo_001',
        createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        updatedAt: now,
      },
      {
        _id: 'task_002',
        title: 'Implement Redis Caching & Invalidation Flow',
        description: 'Verify cache-aside pattern on GET /api/tasks and check automatic invalidation on task create/update/delete operations.',
        priority: 'High',
        status: 'Completed',
        category: 'Work',
        deadline: futureDate(1),
        userId: 'user_demo_001',
        createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
        updatedAt: now,
      },
      {
        _id: 'task_003',
        title: 'Integrate Open-Meteo Weather API with Timeout Guard',
        description: 'Backend proxy for weather statistics with 5-second timeout, rate limit guard, and dashboard widget synchronization.',
        priority: 'Medium',
        status: 'Completed',
        category: 'Study',
        deadline: futureDate(3),
        userId: 'user_demo_001',
        createdAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
        updatedAt: now,
      },
      {
        _id: 'task_004',
        title: 'Conduct End-to-End REST API Load & Security Audit',
        description: 'Test JWT authentication middleware, rate limiting thresholds, bcrypt salt rounds, and MongoDB input sanitization.',
        priority: 'High',
        status: 'Pending',
        category: 'Work',
        deadline: futureDate(5),
        userId: 'user_demo_001',
        createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
        updatedAt: now,
      },
      {
        _id: 'task_005',
        title: 'Review Responsive UI & Mobile Breakpoints',
        description: 'Verify Bootstrap grid collapse, sidebar offcanvas drawer on mobile, and touch-friendly action buttons.',
        priority: 'Low',
        status: 'Pending',
        category: 'Personal',
        deadline: futureDate(7),
        userId: 'user_demo_001',
        createdAt: now,
        updatedAt: now,
      },
    ];

    this.tasks = demoTasks;
  }

  async find(filter: any = {}): Promise<any[]> {
    let result = [...this.tasks];

    if (filter.userId) {
      result = result.filter((t) => t.userId === filter.userId);
    }
    if (filter.status && filter.status !== 'all') {
      result = result.filter((t) => t.status === filter.status);
    }
    if (filter.priority && filter.priority !== 'all') {
      result = result.filter((t) => t.priority === filter.priority);
    }
    if (filter.category && filter.category !== 'all') {
      result = result.filter((t) => t.category === filter.category);
    }
    if (filter.search) {
      const q = filter.search.toLowerCase();
      result = result.filter((t) => t.title.toLowerCase().includes(q) || (t.description && t.description.toLowerCase().includes(q)));
    }

    // Default sorting: created descending
    result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return result.map((t) => this.wrapDoc(t));
  }

  async findById(id: string): Promise<any | null> {
    const task = this.tasks.find((t) => t._id === id);
    if (!task) return null;
    return this.wrapDoc(task);
  }

  async findOne(query: any): Promise<any | null> {
    const list = await this.find(query);
    return list.length > 0 ? list[0] : null;
  }

  async create(data: ITask): Promise<any> {
    const doc: ITask & { _id: string; createdAt: Date; updatedAt: Date } = {
      _id: 'tsk_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      title: data.title.trim(),
      description: data.description ? data.description.trim() : '',
      priority: data.priority || 'Medium',
      status: data.status || 'Pending',
      category: data.category || 'Work',
      deadline: data.deadline ? new Date(data.deadline) : undefined,
      userId: data.userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.tasks.unshift(doc);
    return this.wrapDoc(doc);
  }

  async findByIdAndUpdate(id: string, update: Partial<ITask>, options: { new?: boolean } = {}): Promise<any | null> {
    const index = this.tasks.findIndex((t) => t._id === id);
    if (index === -1) return null;

    const existing = this.tasks[index];
    const updated = {
      ...existing,
      ...update,
      deadline: update.deadline !== undefined ? (update.deadline ? new Date(update.deadline) : undefined) : existing.deadline,
      updatedAt: new Date(),
    };
    this.tasks[index] = updated;
    return this.wrapDoc(updated);
  }

  async findByIdAndDelete(id: string): Promise<any | null> {
    const index = this.tasks.findIndex((t) => t._id === id);
    if (index === -1) return null;
    const removed = this.tasks.splice(index, 1)[0];
    return this.wrapDoc(removed);
  }

  async countDocuments(filter: any = {}): Promise<number> {
    const list = await this.find(filter);
    return list.length;
  }

  private wrapDoc(raw: ITask & { _id: string; createdAt: Date; updatedAt: Date }) {
    return {
      ...raw,
      toObject: () => ({ ...raw }),
      toJSON: () => ({ ...raw }),
    };
  }
}

export const taskMemoryRepo = new TaskMemoryRepository();
