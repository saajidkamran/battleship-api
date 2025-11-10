// Entry point - Start the server
import app from "./app";
import { logger } from "./utils/logger";
import { env } from "./config/env";
import { initializeServices } from "./config/initializeServices";
import { setupGracefulShutdown, setupErrorHandlers } from "./config/gracefulShutdown";

/**
 * Start the server and initialize all services
 */
const startServer = async (): Promise<void> => {
  try {
    // Setup error handlers first
    setupErrorHandlers();

    // Initialize services (Redis, Database)
    await initializeServices();

    // Start the HTTP server
    const server = app.listen(env.PORT, () => {
      logger.info(`🚀 Battleship API running on port ${env.PORT}`, {
        port: env.PORT,
        environment: env.NODE_ENV,
      });
    });

    // Setup graceful shutdown handlers
    setupGracefulShutdown(server);
  } catch (error: any) {
    logger.error("Failed to start server", error);
    process.exit(1);
  }
};

// Start the server
startServer();

