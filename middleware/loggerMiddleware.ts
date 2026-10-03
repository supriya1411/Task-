import { Request, Response, NextFunction } from 'express';

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  const timestamp = new Date().toISOString();
  const ip = req.ip || req.socket.remoteAddress || 'unknown';

  // Listen to response finish event
  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;

    // Color code based on status
    const statusColor =
      status >= 500
        ? '\x1b[31m' // Red
        : status >= 400
        ? '\x1b[33m' // Yellow
        : status >= 300
        ? '\x1b[36m' // Cyan
        : '\x1b[32m'; // Green
    const resetColor = '\x1b[0m';

    console.log(
      `[HTTP ${timestamp}] ${req.method} ${req.originalUrl} ${statusColor}${status}${resetColor} - ${duration}ms (${ip})`
    );
  });

  next();
}
