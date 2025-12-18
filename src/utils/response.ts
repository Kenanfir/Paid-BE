import { Response } from 'express';
import { ApiResponse, ApiErrorDetail } from '../types';

/**
 * Send a success response
 * @param res Express response object
 * @param message Success message
 * @param data The data to include in the response
 * @param statusCode HTTP status code (default: 200)
 */
export const sendSuccess = <T>(
  res: Response,
  message: string,
  data: T,
  statusCode = 200
): void => {
  const response: ApiResponse<T> = {
    message,
    data,
  };

  res.status(statusCode).json(response);
};

/**
 * Send an error response
 * @param res Express response object
 * @param message Error message
 * @param errors Array of errors
 * @param statusCode HTTP status code (default: 400)
 */
export const sendError = (
  res: Response,
  message: string,
  errors: ApiErrorDetail[] = [],
  statusCode = 400
): void => {
  const response = {
    error: message,
    details: errors.length > 0 ? errors : undefined,
  };

  res.status(statusCode).json(response);
};
