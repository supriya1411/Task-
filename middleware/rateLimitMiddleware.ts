import rateLimit from 'express-rate-limit';

// Standard API Rate Limiter (Task 8)
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 120, // max 120 requests per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too Many Requests',
    message: 'Rate limit exceeded: You have made too many API requests. Please try again in a few minutes.',
  },
});

// Weather API Endpoint Rate Limiter (Task 7)
export const weatherRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 50, // max 50 queries per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too Many Requests',
    message: 'Weather service request limit reached. Using cached weather metrics where possible.',
  },
});

// Authentication Rate Limiter (Brute-force protection)
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // max 30 auth attempts per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too Many Requests',
    message: 'Too many authentication attempts from this IP address. Please try again after 15 minutes.',
  },
});
