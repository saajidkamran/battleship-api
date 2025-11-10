import { Request, Response, NextFunction } from "express";

const REQUEST_TIMEOUT_MS = parseInt(
  process.env.REQUEST_TIMEOUT_MS || "30000",
  10
); // Default 30 seconds

/**
 * Middleware to timeout long-running requests
 * Prevents requests from hanging indefinitely and consuming resources
 */
export const requestTimeoutMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const timeout = setTimeout(() => {
    if (!res.headersSent) {
      res.status(408).json({
        error: {
          message: "Request timeout",
          code: "REQUEST_TIMEOUT",
        },
      });
    }
  }, REQUEST_TIMEOUT_MS);

  // Clear timeout when response is finished
  res.on("finish", () => {
    clearTimeout(timeout);
  });

  res.on("close", () => {
    clearTimeout(timeout);
  });

  next();
};

