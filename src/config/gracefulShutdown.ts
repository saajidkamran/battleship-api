import { Server } from "http";
import { logger } from "../utils/logger";
import { disconnectRedis } from "./redis";
import { AppDataSource } from "./database";

const SHUTDOWN_TIMEOUT = 10000; // 10 seconds

/**
 * Gracefully shutdown the server and close all connections
 */
export const setupGracefulShutdown = (server: Server): void => {
  const gracefulShutdown = (signal: string) => {
    logger.info(`Received ${signal}, starting graceful shutdown...`);

    // Stop accepting new connections
    server.close(async () => {
      logger.info("Server closed successfully");

      // Close Redis connection
      try {
        await disconnectRedis();
      } catch (error: any) {
        logger.warn("Error closing Redis connection", error);
      }

      // Close database connection
      try {
        if (AppDataSource.isInitialized) {
          await AppDataSource.destroy();
          logger.info("Database connection closed");
        }
      } catch (error: any) {
        logger.error("Error closing database connection", error);
      }

      logger.info("Graceful shutdown completed");
      process.exit(0);
    });

    // Force shutdown after timeout
    setTimeout(() => {
      logger.error("Forced shutdown after timeout");
      process.exit(1);
    }, SHUTDOWN_TIMEOUT);
  };

  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));
};

/**
 * Setup error handlers for uncaught exceptions and unhandled rejections
 */
export const setupErrorHandlers = (): void => {
  process.on("uncaughtException", (error: Error) => {
    logger.error("Uncaught exception", error);
    process.exit(1);
  });

  process.on("unhandledRejection", (reason: unknown) => {
    logger.error("Unhandled promise rejection", reason);
    process.exit(1);
  });
};
