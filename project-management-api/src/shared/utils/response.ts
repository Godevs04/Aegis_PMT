import { Response } from 'express';

interface MetaData {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
  [key: string]: unknown;
}

interface StandardResponseArgs<T> {
  res: Response;
  statusCode: number;
  success: boolean;
  message: string;
  data?: T;
  meta?: MetaData;
  errors?: Record<string, string[]> | string[] | null;
}

/**
 * Sends a standardized API response.
 */
export const sendResponse = <T>({
  res,
  statusCode,
  success,
  message,
  data = undefined,
  meta = undefined,
  errors = undefined,
}: StandardResponseArgs<T>): Response => {
  return res.status(statusCode).json({
    success,
    message,
    data,
    meta,
    errors,
  });
};

export default sendResponse;
