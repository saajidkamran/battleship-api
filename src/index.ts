//  # Entry point (start server)// src/index.ts
import app from "./app";
import { logger } from "./utils/logger";
import { env } from "./config/env";
import { AppDataSource } from "./config/database";

// Calculate exponential backoff delay with jitter
const calculateBackoffDelay = (attempt: number, baseDelay: number = 1000): number => {
  // Exponential backoff: baseDelay * 2^attempt
  const exponentialDelay = baseDelay * Math.pow(2, attempt);
  
  // Add jitter: random value between 0 and 30% of the delay
  const jitter = Math.random() * exponentialDelay * 0.3;
  
  // Cap maximum delay at 10 seconds
  const totalDelay = Math.min(exponentialDelay + jitter, 10000);
  
  return Math.floor(totalDelay);
};

// Initialize database connection with exponential backoff and jitter
const connectDatabase = async (retries = 5, baseDelay = 1000): Promise<void> => {
  for (let i = 0; i < retries; i++) {
    try {
      logger.info(`Connecting to MySQL database... (Attempt ${i + 1}/${retries})`, {
        host: process.env.DB_HOST || "localhost",
        port: process.env.DB_PORT || 3306,
        database: process.env.DB_NAME || "battleship",
      });
      
      await AppDataSource.initialize();
      logger.info("✅ MySQL database connected successfully");
      return;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorCode = (error as { code?: string }).code || "UNKNOWN";
      
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
        logger.error("❌ Failed to connect to MySQL database after all retries", {
          totalAttempts: retries,
          lastError: errorMessage,
          errorCode,
        });
        throw error;
      }
    }
  }
};

// Initialize database connection before starting server
const startServer = async () => {
  try {
    // Initialize database connection
    if (process.env.DB_HOST || process.env.DB_NAME) {
      try {
        await connectDatabase();
      } catch (error) {
        logger.error("Database connection failed. The app will continue with in-memory storage.", error);
        logger.info("To use database, ensure MySQL is running and environment variables are set correctly.");
      }
    } else {
      logger.info("⚠️  No database configuration found, using in-memory storage");
    }

    // Start the server after database is ready
    const server = app.listen(env.PORT, () => {
      logger.info(`Battleship API running on port ${env.PORT}`, { 
        port: env.PORT,
        environment: env.NODE_ENV,
      });
    });

    // Graceful shutdown handling
    const gracefulShutdown = (signal: string) => {
      logger.info(`Received ${signal}, starting graceful shutdown...`);
      
      server.close(async () => {
        logger.info("Server closed successfully");
        
        // Close database connection
        if (AppDataSource.isInitialized) {
          await AppDataSource.destroy();
          logger.info("Database connection closed");
        }
        
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error("Forced shutdown after timeout");
        process.exit(1);
      }, 10000);
    };

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));

    // Handle uncaught exceptions
    process.on("uncaughtException", (error: Error) => {
      logger.error("Uncaught exception", error);
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on("unhandledRejection", (reason: unknown) => {
      logger.error("Unhandled promise rejection", reason);
      process.exit(1);
    });
  } catch (error) {
    logger.error("Failed to start server", error);
    process.exit(1);
  }
};

startServer();

