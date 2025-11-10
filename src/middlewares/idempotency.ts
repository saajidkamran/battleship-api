import { Request, Response, NextFunction } from "express";
import { createBadRequestError } from "../utils/errors";
import { logger } from "../utils/logger";
import {
  getCachedIdempotency,
  cacheIdempotency,
} from "../services/cacheService";

export const idempotencyHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const key = req.header("Idempotency-Key");

  if (!key) {
    throw createBadRequestError("Missing Idempotency-Key header");
  }

  const cachedResponse = await getCachedIdempotency(key);

  if (cachedResponse) {
    logger.info("Idempotent request detected", {
      requestId: req.requestId,
      idempotencyKey: key,
    });
    return res.status(200).json({
      ...(cachedResponse as Record<string, unknown>),
      idempotent: true,
    });
  }

  // Monkey-patch res.json() to store the result in Redis
  const originalJson = res.json.bind(res);
  res.json = (body: unknown) => {
    // Cache the response in Redis (fire and forget - don't block response)
    cacheIdempotency(key, body).catch((error) => {
      logger.warn("Failed to cache idempotency response", error);
    });
    return originalJson(body);
  };

  next();
};
