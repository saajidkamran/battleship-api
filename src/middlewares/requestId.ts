import { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";

export const requestIdMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Use existing request ID from header if present, otherwise generate one
  const requestId = (req.headers["x-request-id"] as string) || randomUUID();
  req.requestId = requestId;

  // Add request ID to response header for client tracking
  res.setHeader("X-Request-ID", requestId);

  next();
};
