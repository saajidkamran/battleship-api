// Rate limiter setup
import rateLimit from "express-rate-limit";
import { Request, Response, NextFunction } from "express";

// Disable rate limiting in test environment to avoid test failures
const isTestEnv = process.env.NODE_ENV === "test" || process.env.JEST_WORKER_ID !== undefined;

// Create rate limiter for production
const productionRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: parseInt(process.env.RATE_LIMIT_MAX || "10", 10), // Configurable rate limit
  message: {
    error: "Too many requests, please try again later.",
    code: "RATE_LIMIT_EXCEEDED",
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  // Store rate limit info in Redis for distributed systems (optional)
  // store: redisStore, // Uncomment if using Redis for rate limiting across instances
});

// No-op middleware for test environment
const testRateLimiter = (req: Request, res: Response, next: NextFunction) => {
  next();
};

// Export appropriate rate limiter based on environment
export const rateLimiter = isTestEnv ? testRateLimiter : productionRateLimiter;
