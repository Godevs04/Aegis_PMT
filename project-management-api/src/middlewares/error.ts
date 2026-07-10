import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import AppError from '../shared/utils/appError';
import sendResponse from '../shared/utils/response';
import logger from '../config/logger';

/**
 * Centralized error handler middleware.
 */
export const errorHandler = (
  err: Error | AppError | ZodError,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let errors: Record<string, string[]> | string[] | null = null;

  // Log details
  logger.error(`${err.name}: ${err.message}\nStack: ${err.stack}`);

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    errors = err.errors || null;
  } else if (err instanceof ZodError) {
    statusCode = 400;
    message = 'Validation Error';
    const formattedErrors: Record<string, string[]> = {};
    err.errors.forEach((issue) => {
      const field = issue.path.join('.');
      if (!formattedErrors[field]) {
        formattedErrors[field] = [];
      }
      formattedErrors[field].push(issue.message);
    });
    errors = formattedErrors;
  } else if (err.name === 'ValidationError') {
    // Mongoose Validation Error
    statusCode = 400;
    message = 'Mongoose Validation Error';
    const formattedErrors: Record<string, string[]> = {};
    const mongoErrors = (err as unknown as { errors: Record<string, { message: string; path: string }> }).errors;
    for (const key in mongoErrors) {
      formattedErrors[key] = [mongoErrors[key].message];
    }
    errors = formattedErrors;
  } else if (err.name === 'CastError') {
    // Mongoose Cast Error (invalid ObjectId)
    statusCode = 400;
    message = `Invalid ${(err as unknown as { path: string }).path}: ${(err as unknown as { value: string }).value}`;
  } else if ((err as unknown as { code: number }).code === 11000) {
    // Mongo duplicate key error
    statusCode = 409;
    const keyPattern = (err as unknown as { keyValue: Record<string, unknown> }).keyValue;
    const duplicatedField = Object.keys(keyPattern)[0];
    message = `${duplicatedField.charAt(0).toUpperCase() + duplicatedField.slice(1)} already exists`;
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token. Please log in again.';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Your token has expired. Please log in again.';
  }

  // Handle environments
  const isProd = process.env.NODE_ENV === 'production';

  sendResponse({
    res,
    statusCode,
    success: false,
    message,
    errors: errors || (isProd ? null : [err.message]),
  });
};

export default errorHandler;
