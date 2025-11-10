import { Router, Request, Response } from "express";
import { AppDataSource } from "../../config/database";
import { testRedisConnection } from "../../config/redis";

const router = Router();

router.get("/health", async (req: Request, res: Response) => {
  const health = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
    services: {
      database: "unknown",
      redis: "unknown",
    },
  };

  // Check database connection
  try {
    if (AppDataSource.isInitialized) {
      await AppDataSource.query("SELECT 1");
      health.services.database = "connected";
    } else {
      health.services.database = "disconnected";
    }
  } catch (error) {
    health.services.database = "error";
    health.status = "degraded";
  }

  // Check Redis connection
  try {
    const isConnected = await testRedisConnection();
    health.services.redis = isConnected ? "connected" : "disconnected";
    if (!isConnected && process.env.NODE_ENV === "production") {
      health.status = "degraded";
    }
  } catch (error) {
    health.services.redis = "error";
    // Redis is optional, so don't mark as degraded unless in production
    if (process.env.NODE_ENV === "production") {
      health.status = "degraded";
    }
  }

  const statusCode = health.status === "healthy" ? 200 : 503;
  res.status(statusCode).json(health);
});

export default router;
