import { Router } from 'express';
import { WeatherController } from '../controllers/weatherController.ts';
import { weatherRateLimiter } from '../middleware/rateLimitMiddleware.ts';

const router = Router();

// GET /api/weather with rate limiting & caching (Task 7)
router.get('/', weatherRateLimiter, WeatherController.getWeather);

export default router;
