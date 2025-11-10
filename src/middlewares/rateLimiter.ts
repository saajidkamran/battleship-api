import rateLimit from "express-rate-limit";
import { Request, Response, NextFunction } from "express";

const isTestEnv =
  process.env.NODE_ENV === "test" || process.env.JEST_WORKER_ID !== undefined;

const productionRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: parseInt(process.env.RATE_LIMIT_MAX || "10", 10),
  message: {
    error: "Too many requests, please try again later.",
    code: "RATE_LIMIT_EXCEEDED",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const testRateLimiter = (req: Request, res: Response, next: NextFunction) => {
  next();
};

export const rateLimiter = isTestEnv ? testRateLimiter : productionRateLimiter;
