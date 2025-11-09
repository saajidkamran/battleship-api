// Rate limiter setup
import rateLimit from "express-rate-limit";
import { Request, Response, NextFunction } from "express";

// Disable rate limiting in test environment to avoid test failures
const isTestEnv = process.env.NODE_ENV === "test" || process.env.JEST_WORKER_ID !== undefined;

// Create rate limiter for production
const productionRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 requests per minute
  message: {
    error: "Too many requests, please try again later.",
  },
});

// No-op middleware for test environment
const testRateLimiter = (req: Request, res: Response, next: NextFunction) => {
  next();
};

// Export appropriate rate limiter based on environment
export const rateLimiter = isTestEnv ? testRateLimiter : productionRateLimiter;
