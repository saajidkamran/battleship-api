import { logger } from "../utils/logger";
import { connectRedis } from "./redis";
import { AppDataSource } from "./database";

/**
 * Calculate exponential backoff delay with jitter
 */
const calculateBackoffDelay = (
  attempt: number,
  baseDelay: number = 1000
): number => {
  // Exponential backoff: baseDelay * 2^attempt
  const exponentialDelay = baseDelay * Math.pow(2, attempt);

  // Add jitter: random value between 0 and 30% of the delay
  const jitter = Math.random() * exponentialDelay * 0.3;

  // Cap maximum delay at 10 seconds
  const totalDelay = Math.min(exponentialDelay + jitter, 10000);

  return Math.floor(totalDelay);
};

export const initializeRedis = async (): Promise<void> => {
  try {
    await connectRedis();
    logger.info("Redis initialized successfully");
  } catch (error: any) {
    logger.warn(
      "⚠️ Redis initialization failed. The app will continue without caching.",
      error
    );
    logger.info(
      "To use Redis caching, ensure Redis is running. Defaults: localhost:6379"
    );
  }
};

/**
 * Initialize database connection with exponential backoff and jitter
 */
export const initializeDatabase = async (
  retries: number = 5,
  baseDelay: number = 1000
): Promise<void> => {
  const isProduction = process.env.NODE_ENV === "production";
  
  // In production, database is required
  if (isProduction && (!process.env.DB_HOST || !process.env.DB_NAME)) {
    throw new Error(
      "Database configuration is required in production. Please set DB_HOST, DB_USER, DB_PASS, and DB_NAME environment variables."
    );
  }

  // In development/test, allow app to start without database
  if (!isProduction && !process.env.DB_HOST && !process.env.DB_NAME) {
    logger.info("⚠️  No database configuration found. App will start without database.");
    return;
  }

  for (let i = 0; i < retries; i++) {
    try {
      logger.info(
        `Connecting to MySQL database... (Attempt ${i + 1}/${retries})`,
        {
          host: process.env.DB_HOST || "localhost",
          port: process.env.DB_PORT || 3306,
          database: process.env.DB_NAME || "battleship",
        }
      );

      await AppDataSource.initialize();
      logger.info("MySQL database connected successfully");
      return;
    } catch (error: any) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorCode = error?.code || "UNKNOWN";

      logger.warn(`Database connection attempt ${i + 1} failed`, {
        error: errorMessage,
        code: errorCode,
        attempt: i + 1,
        maxRetries: retries,
      });

      if (i < retries - 1) {
        const delay = calculateBackoffDelay(i, baseDelay);
        logger.info(
          `Retrying in ${delay}ms with exponential backoff + jitter...`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        const finalError = new Error(
          `Failed to connect to MySQL database after ${retries} attempts. Last error: ${errorMessage}`
        );
        logger.error("Failed to connect to MySQL database after all retries", {
          totalAttempts: retries,
          lastError: errorMessage,
          errorCode,
        });
        
        // In production, throw error to prevent server from starting
        if (isProduction) {
          throw finalError;
        }
        
        // In development/test, log warning but allow app to continue
        logger.warn("⚠️  App will continue without database connection in development mode");
      }
    }
  }
};

/**
 * Initialize all services (Redis, Database)
 */
export const initializeServices = async (): Promise<void> => {
  logger.info("Initializing services...");

  await initializeRedis();

  await initializeDatabase();

  logger.info("Service initialization completed");
};
