//  # Entry point (start server)// src/index.ts
import app from "./app";
import { logger } from "./utils/logger";
import { env } from "./config/env";
import { AppDataSource } from "./config/database";

// Initialize database connection with retry logic
const connectDatabase = async (retries = 5, delay = 2000): Promise<void> => {
  for (let i = 0; i < retries; i++) {
    try {
      logger.info(
        `Connecting to MySQL database... (Attempt ${i + 1}/${retries})`
      );
      await AppDataSource.initialize();
      logger.info("Database connected successfully");
      return;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      logger.warn(
        `Database connection attempt ${i + 1} failed: ${errorMessage}`
      );

      if (i < retries - 1) {
        logger.info(`Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        logger.error("Failed to connect to Database after all retries");
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
        logger.error(
          "Database connection failed. The app will continue with in-memory storage.",
          error
        );
        logger.info(
          "To use database, ensure MySQL is running and environment variables are set correctly."
        );
      }
    } else {
      logger.info(
        "⚠️  No database configuration found, using in-memory storage"
      );
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
