import Redis from "ioredis";
import { logger } from "../utils/logger";

// Redis configuration
const redisConfig = {
  host: process.env.REDIS_HOST || "localhost",
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD,
  db: Number(process.env.REDIS_DB) || 0,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  enableOfflineQueue: false, // Don't queue commands when Redis is down
  lazyConnect: true, // Don't connect immediately
};

// Create Redis client
export const redisClient = new Redis(redisConfig);

// Redis connection event handlers
redisClient.on("connect", () => {
  logger.info("Redis client connecting...");
});

redisClient.on("ready", () => {
  logger.info("✅ Redis client connected and ready");
});

redisClient.on("error", (error) => {
  logger.error("Redis client error", error);
});

redisClient.on("close", () => {
  logger.warn("Redis client connection closed");
});

redisClient.on("reconnecting", () => {
  logger.info("Redis client reconnecting...");
});

// Initialize Redis connection
export const connectRedis = async (): Promise<void> => {
  try {
    await redisClient.connect();
    logger.info("Redis connected successfully", {
      host: redisConfig.host,
      port: redisConfig.port,
    });
  } catch (error: any) {
    logger.warn(
      "Redis connection failed. The app will continue without caching.",
      error
    );
    logger.info(
      "To use Redis caching, ensure Redis is running and environment variables are set correctly."
    );
  }
};

// Gracefully close Redis connection
export const disconnectRedis = async (): Promise<void> => {
  try {
    await redisClient.quit();
    logger.info("Redis connection closed");
  } catch (error) {
    logger.error("Error closing Redis connection", error);
  }
};

// Health check for Redis
export const isRedisConnected = (): boolean => {
  return redisClient.status === "ready";
};
