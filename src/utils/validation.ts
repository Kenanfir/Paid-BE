import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import { sendError } from "./response";
import { ApiErrorDetail } from "../types";

/**
 * Middleware to validate request data
 * @param req Express request
 * @param res Express response
 * @param next Express next function
 */
export const validate = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const errors = validationResult(req);

  if (errors.isEmpty()) {
    return next();
  }

  const validationErrors: ApiErrorDetail[] = errors
    .array()
    .map((error: { path?: string; msg?: string }) => ({
      field: error.path || "unknown",
      message: error.msg || "Validation error",
    }));

  sendError(res, "Validation Error", validationErrors, 400);
};
