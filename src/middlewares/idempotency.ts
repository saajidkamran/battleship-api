import { Request, Response, NextFunction } from "express";
import { createBadRequestError } from "../utils/errors";
import { logger } from "../utils/logger";

//TODO:Temporary in-memory cache for demo (later Redis)
const idempotencyCache = new Map<string, unknown>();

export const idempotencyHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const key = req.header("Idempotency-Key");

  // Require key
  if (!key) {
    throw createBadRequestError("Missing Idempotency-Key header");
  }

  // If already processed → return cached response
  if (idempotencyCache.has(key)) {
    const cached = idempotencyCache.get(key);
    logger.info("Idempotent request detected", {
      requestId: req.requestId,
      idempotencyKey: key,
    });
    return res.status(200).json({ ...(cached as Record<string, unknown>), idempotent: true });
  }

  // Monkey-patch res.json() to store the result
  const originalJson = res.json.bind(res);
  res.json = (body: unknown) => {
    idempotencyCache.set(key, body);
    return originalJson(body);
  };

  next();
};
