import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error('[Error]', err.message, err.stack);

  // Prisma known errors
  if (err.message.includes('Unique constraint')) {
    res.status(409).json({ error: 'A record with this value already exists.' });
    return;
  }

  if (err.message.includes('Record to update not found')) {
    res.status(404).json({ error: 'Record not found.' });
    return;
  }

  res.status(500).json({
    error: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { details: err.message }),
  });
}
