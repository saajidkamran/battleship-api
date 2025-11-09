import { logger } from "../utils/logger";
import { connectRedis } from "./redis";
import { AppDataSource } from "./database";

/**
 * Calculate exponential backoff delay with jitter
 */
const calculateBackoffDelay = (attempt: number, baseDelay: number = 1000): number => {
  // Exponential backoff: baseDelay * 2^attempt
  const exponentialDelay = baseDelay * Math.pow(2, attempt);

  // Add jitter: random value between 0 and 30% of the delay
  const jitter = Math.random() * exponentialDelay * 0.3;

  // Cap maximum delay at 10 seconds
  const totalDelay = Math.min(exponentialDelay + jitter, 10000);

  return Math.floor(totalDelay);
};

/**
 * Initialize Redis connection
 * Non-blocking - app continues if Redis is unavailable
 */
export const initializeRedis = async (): Promise<void> => {
  try {
    await connectRedis();
    logger.info("Redis initialized successfully");
  } catch (error: any) {
    logger.warn("⚠️  Redis initialization failed. The app will continue without caching.", error);
    logger.info("To use Redis caching, ensure Redis is running. Defaults: localhost:6379");
  }
};

/**
 * Initialize database connection with exponential backoff and jitter
 */
export const initializeDatabase = async (
  retries: number = 5,
  baseDelay: number = 1000
): Promise<void> => {
  // Skip if no database configuration
  if (!process.env.DB_HOST && !process.env.DB_NAME) {
    logger.info("⚠️  No database configuration found, using in-memory storage");
    return;
  }

  for (let i = 0; i < retries; i++) {
    try {
      logger.info(`Connecting to MySQL database... (Attempt ${i + 1}/${retries})`, {
        host: process.env.DB_HOST || "localhost",
        port: process.env.DB_PORT || 3306,
        database: process.env.DB_NAME || "battleship",
      });

      await AppDataSource.initialize();
      logger.info("MySQL database connected successfully");
      return;
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorCode = error?.code || "UNKNOWN";

      logger.warn(`Database connection attempt ${i + 1} failed`, {
        error: errorMessage,
        code: errorCode,
        attempt: i + 1,
        maxRetries: retries,
      });

      if (i < retries - 1) {
        const delay = calculateBackoffDelay(i, baseDelay);
        logger.info(`Retrying in ${delay}ms with exponential backoff + jitter...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        logger.error("Failed to connect to MySQL database after all retries", {
          totalAttempts: retries,
          lastError: errorMessage,
          errorCode,
        });
        logger.warn("The app will continue with in-memory storage");
        // Don't throw - allow app to continue without database
      }
    }
  }
};

/**
 * Initialize all services (Redis, Database)
 */
export const initializeServices = async (): Promise<void> => {
  logger.info("Initializing services...");

  // Initialize Redis (non-blocking)
  await initializeRedis();

  // Initialize Database (non-blocking)
  await initializeDatabase();

  logger.info("Service initialization completed");
};

