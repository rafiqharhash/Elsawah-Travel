import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { sendResponse } from '../utils/responseFormatter';
import { ZodError } from 'zod';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error(`${req.method} ${req.url} - ${err.message}`, { stack: err.stack });

  if (err instanceof ZodError) {
    return sendResponse(res, 400, false, 'Validation Error', null, err.errors);
  }

  if (err.name === 'ValidationError') {
    return sendResponse(res, 400, false, 'Mongoose Validation Error', null, err.errors);
  }

  if (err.code === 11000) {
    return sendResponse(res, 409, false, 'Duplicate Key Error', null, err.keyValue);
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  sendResponse(res, statusCode, false, message);
};

export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}
