// Custom error types and factory functions for better error handling
export interface AppError extends Error {
  statusCode: number;
  isOperational: boolean;
  code?: string;
  details?: unknown;
}

const createAppError = (
  message: string,
  statusCode: number = 500,
  isOperational: boolean = true,
  code?: string,
  details?: unknown
): AppError => {
  const error = Object.create(Error.prototype) as AppError;
  error.message = message;
  error.statusCode = statusCode;
  error.isOperational = isOperational;
  error.code = code;
  error.details = details;
  error.name = "AppError";

  Error.captureStackTrace(error, createAppError);
  return error;
};

export const createNotFoundError = (
  message: string = "Resource not found",
  details?: unknown
): AppError => {
  return createAppError(message, 404, true, "NOT_FOUND", details);
};

export const createValidationError = (
  message: string = "Validation failed",
  details?: unknown
): AppError => {
  return createAppError(message, 400, true, "VALIDATION_ERROR", details);
};

export const createBadRequestError = (
  message: string = "Bad request",
  details?: unknown
): AppError => {
  return createAppError(message, 400, true, "BAD_REQUEST", details);
};

export const createConflictError = (
  message: string = "Conflict",
  details?: unknown
): AppError => {
  return createAppError(message, 409, true, "CONFLICT", details);
};

export const createInternalServerError = (
  message: string = "Internal server error",
  details?: unknown
): AppError => {
  return createAppError(message, 500, false, "INTERNAL_ERROR", details);
};

// Type guard to check if error is AppError
export const isAppError = (error: unknown): error is AppError => {
  return (
    typeof error === "object" &&
    error !== null &&
    "statusCode" in error &&
    "isOperational" in error &&
    typeof (error as AppError).statusCode === "number"
  );
};
