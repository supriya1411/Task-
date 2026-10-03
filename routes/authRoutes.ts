import { Router } from 'express';
import { AuthController } from '../controllers/authController.ts';
import { validateRegistration, validateLogin } from '../middleware/validationMiddleware.ts';
import { requireAuth } from '../middleware/authMiddleware.ts';
import { authRateLimiter } from '../middleware/rateLimitMiddleware.ts';

const router = Router();

router.post('/register', authRateLimiter, validateRegistration, AuthController.register);
router.post('/login', authRateLimiter, validateLogin, AuthController.login);
router.post('/logout', AuthController.logout);
router.get('/me', requireAuth, AuthController.getMe);

export default router;
