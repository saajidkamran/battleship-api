import { Request, Response, NextFunction } from "express";
import { AppError, isAppError } from "../utils/errors";
import { logger } from "../utils/logger";

// Extend Request to include requestId
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const requestId = req.requestId || "unknown";
  const isDevelopment = process.env.NODE_ENV === "development";

  // Handle known operational errors
  if (isAppError(err)) {
    logger.error("Operational error occurred", err, {
      requestId,
      path: req.path,
      method: req.method,
      statusCode: err.statusCode,
      code: err.code,
    });

    return res.status(err.statusCode).json({
      error: {
        message: err.message,
        code: err.code,
        ...(isDevelopment && err.details ? { details: err.details } : {}),
        ...(isDevelopment ? { requestId } : {}),
      },
    });
  }

  // Handle validation errors from express-validator
  if (err.name === "ValidationError" || (err as { errors?: unknown }).errors) {
    logger.warn("Validation error", {
      requestId,
      path: req.path,
      method: req.method,
      errors: (err as { errors?: unknown }).errors,
    });

    return res.status(400).json({
      error: {
        message: "Validation failed",
        code: "VALIDATION_ERROR",
        ...(isDevelopment ? { details: (err as { errors?: unknown }).errors } : {}),
        ...(isDevelopment ? { requestId } : {}),
      },
    });
  }

  // Handle unknown/unexpected errors
  logger.error("Unexpected error occurred", err, {
    requestId,
    path: req.path,
    method: req.method,
    stack: isDevelopment ? err.stack : undefined,
  });

  // Sanitize error message for production
  const message = isDevelopment
    ? err.message || "Internal Server Error"
    : "An unexpected error occurred. Please try again later.";

  res.status(500).json({
    error: {
      message,
      code: "INTERNAL_ERROR",
      ...(isDevelopment ? { requestId } : {}),
    },
  });
};
