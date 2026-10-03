import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService.ts';

export class AuthController {
  // POST /api/auth/register or POST /register
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, email, password, phone } = req.body;
      const { user, token } = await AuthService.register({ name, email, password, phone });

      // Set HTTP-Only Cookie for session persistence across EJS pages (with SameSite=None and Secure for iframes)
      res.cookie('token', token, {
        httpOnly: true,
        secure: true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        sameSite: 'none',
      });

      if (req.originalUrl.startsWith('/api/')) {
        return res.status(201).json({
          success: true,
          message: 'Account registered successfully.',
          data: { user, token },
        });
      }

      // Redirect to dashboard on browser form submit (include token in query for iframe cookie resilience)
      return res.redirect(`/dashboard?registered=true&token=${encodeURIComponent(token)}`);
    } catch (err: any) {
      if (req.originalUrl.startsWith('/api/')) {
        return res.status(400).json({
          success: false,
          error: 'Registration Failed',
          message: err.message,
        });
      }

      return res.status(400).render('pages/register', {
        title: 'Register - TaskFlow',
        errors: [{ field: 'email', message: err.message }],
        values: req.body,
        page: 'register',
      });
    }
  }

  // POST /api/auth/login or POST /login
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const { user, token } = await AuthService.login({ email, password });

      res.cookie('token', token, {
        httpOnly: true,
        secure: true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        sameSite: 'none',
      });

      if (req.originalUrl.startsWith('/api/')) {
        return res.status(200).json({
          success: true,
          message: 'Logged in successfully.',
          data: { user, token },
        });
      }

      const redirectBase = (req.query.redirect as string) || '/dashboard';
      const sep = redirectBase.includes('?') ? '&' : '?';
      return res.redirect(`${redirectBase}${sep}token=${encodeURIComponent(token)}`);
    } catch (err: any) {
      if (req.originalUrl.startsWith('/api/')) {
        return res.status(401).json({
          success: false,
          error: 'Authentication Failed',
          message: err.message,
        });
      }

      return res.status(401).render('pages/login', {
        title: 'Login - TaskFlow',
        errors: [{ field: 'credentials', message: err.message }],
        values: { email: req.body.email },
        page: 'login',
      });
    }
  }

  // POST /api/auth/logout or GET /logout
  static async logout(req: Request, res: Response) {
    res.clearCookie('token');

    if (req.originalUrl.startsWith('/api/')) {
      return res.status(200).json({
        success: true,
        message: 'Logged out successfully.',
      });
    }

    return res.redirect('/login?logout=true');
  }

  // GET /api/auth/me
  static async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const user = await AuthService.findById(userId);
      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      return res.status(200).json({
        success: true,
        data: { user },
      });
    } catch (err) {
      next(err);
    }
  }
}
