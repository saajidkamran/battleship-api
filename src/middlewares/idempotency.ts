import { Request, Response, NextFunction } from "express";

//TODO:Temporary in-memory cache for demo (later Redis)
const idempotencyCache = new Map<string, any>();

export const idempotencyHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const key = req.header("Idempotency-Key");

  // Require key
  if (!key) {
    return res.status(400).json({
      error: "Missing Idempotency-Key header",
    });
  }

  // If already processed → return cached response
  if (idempotencyCache.has(key)) {
    const cached = idempotencyCache.get(key);
    return res.status(200).json({ ...cached, idempotent: true });
  }

  // Monkey-patch res.json() to store the result
  const originalJson = res.json.bind(res);
  res.json = (body: any) => {
    idempotencyCache.set(key, body);
    return originalJson(body);
  };

  next();
};
