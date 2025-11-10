import Redis from "ioredis";
import { logger } from "../utils/logger";

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
  enableOfflineQueue: true, // Queue commands when Redis is connecting (allows graceful connection)
  lazyConnect: true, // Don't connect immediately
  connectTimeout: 10000, // 10 second connection timeout
};

export const redisClient = new Redis(redisConfig);

redisClient.on("connect", () => {
  logger.info("Redis client connecting...");
});

redisClient.on("ready", () => {
  logger.info("Redis client connected and ready");
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
  return new Promise((resolve) => {
    const connectionTimeout = setTimeout(() => {
      logger.warn("Redis connection timeout. The app will continue without caching.", {});
      logger.info(
        "To use Redis caching, ensure Redis is running and environment variables are set correctly."
      );
      resolve();
    }, 5000); // 5 second timeout for initial connection

    // Wait for Redis to be ready
    const onReady = async () => {
      clearTimeout(connectionTimeout);
      try {
        // Verify connection with a ping
        await redisClient.ping();
        logger.info("Redis connected successfully", {
          host: redisConfig.host,
          port: redisConfig.port,
        });
        redisClient.removeListener("error", onError);
        resolve();
      } catch (error: unknown) {
        logger.error(
          "Redis connection verification failed. The app will continue without caching.",
          error
        );
        redisClient.removeListener("error", onError);
        resolve();
      }
    };

    // Handle connection errors
    const onError = (error: unknown) => {
      clearTimeout(connectionTimeout);
      logger.error(
        "Redis connection error. The app will continue without caching.",
        error
      );
      logger.info(
        "To use Redis caching, ensure Redis is running and environment variables are set correctly."
      );
      redisClient.removeListener("ready", onReady);
      resolve();
    };

    // If already ready, call onReady immediately
    if (redisClient.status === "ready") {
      onReady();
    } else {
      // Otherwise wait for ready event
      redisClient.once("ready", onReady);
      redisClient.once("error", onError);

      // Trigger connection by sending a command (with lazyConnect: true)
      // With enableOfflineQueue: true, this will be queued until connection is ready
      redisClient.ping().catch(() => {
        // Ignore errors here, they'll be handled by the error event listener
      });
    }
  });
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

// Test Redis connection with a ping
export const testRedisConnection = async (): Promise<boolean> => {
  try {
    await redisClient.ping();
    return true;
  } catch {
    return false;
  }
};
