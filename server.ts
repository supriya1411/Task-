import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';

// Environment configuration
dotenv.config();

// Config imports
import { connectDB, getDatabaseStatus } from './config/db.ts';
import { initRedis, isRedisLive } from './config/redis.ts';
import { initBackgroundJobs } from './jobs/taskQueue.ts';

// Middleware imports
import { requestLogger } from './middleware/loggerMiddleware.ts';
import { notFoundHandler, globalErrorHandler } from './middleware/errorHandler.ts';

// Route imports
import authRoutes from './routes/authRoutes.ts';
import taskRoutes from './routes/taskRoutes.ts';
import weatherRoutes from './routes/weatherRoutes.ts';
import jobRoutes from './routes/jobRoutes.ts';
import pageRoutes from './routes/pageRoutes.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  console.log('================================================================');
  console.log('  TaskFlow – Full Stack Task Management System');
  console.log('  Cognifyz Full Stack Development Internship Submission');
  console.log('================================================================');

  // 1. Initialize Database & Cache Layers
  await connectDB();
  await initRedis();
  initBackgroundJobs();

  // 2. View Engine Setup (EJS - Task 1)
  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, 'views'));

  // 3. Core Middleware Stack (Task 8)
  app.use(cors());
  app.use(requestLogger);
  app.use(cookieParser());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // 4. Static Assets (Bootstrap, CSS, client JS)
  app.use(express.static(path.join(__dirname, 'public')));

  // 5. REST API Routes (Task 5, 6, 7, 8)
  app.use('/api/auth', authRoutes);
  app.use('/api/tasks', taskRoutes);
  app.use('/api/weather', weatherRoutes);
  app.use('/api/jobs', jobRoutes);

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.status(200).json({
      status: 'healthy',
      app: 'TaskFlow',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: getDatabaseStatus(),
      redisLive: isRedisLive(),
    });
  });

  // 6. EJS Server-Side Rendered Page Routes (Task 1, 3, 4)
  app.use('/', pageRoutes);

  // 7. Centralized Error Handling Middleware (Task 8)
  app.use(notFoundHandler);
  app.use(globalErrorHandler);

  // 8. Start HTTP Server
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[TaskFlow Server] Running and listening on http://0.0.0.0:${PORT}`);
    console.log(`[TaskFlow Server] Database: ${getDatabaseStatus().client}`);
    console.log(`[TaskFlow Server] Redis: ${isRedisLive() ? 'Live Server Connected' : 'In-Memory Cache Active'}`);
    console.log(`[TaskFlow Server] Endpoints and EJS Views successfully mounted.`);
  });
}

startServer().catch((err) => {
  console.error('[TaskFlow Server] Fatal startup failure:', err);
  process.exit(1);
});
