import { Request, Response, NextFunction } from 'express';
import { AuthService, TokenPayload } from '../services/authService.ts';

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export function extractToken(req: Request): string | null {
  // 1. Check Authorization Bearer header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // 2. Check Cookie (for browser EJS pages)
  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }

  return null;
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = extractToken(req);

  if (!token) {
    if (req.originalUrl.startsWith('/api/')) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Authentication token is missing. Please provide a valid Bearer token.',
      });
    }
    return res.redirect(`/login?redirect=${encodeURIComponent(req.originalUrl)}`);
  }

  try {
    const payload = AuthService.verifyToken(token);
    req.user = payload;
    res.locals.currentUser = payload;
    next();
  } catch (err: any) {
    // Clear invalid cookie if present
    res.clearCookie('token');

    if (req.originalUrl.startsWith('/api/')) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid or expired authentication token. Please log in again.',
      });
    }
    return res.redirect(`/login?error=${encodeURIComponent('Session expired. Please log in again.')}`);
  }
}

export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const token = extractToken(req);

  if (token) {
    try {
      const payload = AuthService.verifyToken(token);
      req.user = payload;
      res.locals.currentUser = payload;
    } catch (err) {
      // Ignore invalid token in optional context
      res.locals.currentUser = null;
    }
  } else {
    res.locals.currentUser = null;
  }

  next();
}
