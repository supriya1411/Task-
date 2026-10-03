import { Request, Response, NextFunction } from 'express';

export function notFoundHandler(req: Request, res: Response) {
  if (req.originalUrl.startsWith('/api/')) {
    return res.status(404).json({
      success: false,
      error: 'Not Found',
      message: `Cannot ${req.method} ${req.originalUrl} - Endpoint does not exist.`,
    });
  }

  return res.status(404).render('pages/error', {
    title: '404 - Page Not Found',
    statusCode: 404,
    message: `The page at "${req.originalUrl}" could not be located.`,
    page: 'error',
  });
}

export function globalErrorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  const statusCode = err.statusCode || err.status || (res.statusCode >= 400 ? res.statusCode : 500);
  const isProduction = process.env.NODE_ENV === 'production';

  console.error(`[Global Error Handler] [${statusCode}] ${req.method} ${req.originalUrl}:`, err.message);
  if (!isProduction && statusCode === 500) {
    console.error(err.stack);
  }

  // Handle JSON / API responses
  if (req.originalUrl.startsWith('/api/') || req.xhr || req.headers.accept?.includes('application/json')) {
    return res.status(statusCode).json({
      success: false,
      error: err.name || 'InternalServerError',
      message: err.message || 'An unexpected server error occurred.',
      ...(isProduction ? {} : { stack: err.stack }),
    });
  }

  // Handle browser page responses
  return res.status(statusCode).render('pages/error', {
    title: `${statusCode} - Server Error`,
    statusCode,
    message: err.message || 'An unexpected error occurred while processing your request.',
    errorDetails: isProduction ? null : err.stack,
    page: 'error',
  });
}
