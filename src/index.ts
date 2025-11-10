import app from "./app";
import { logger } from "./utils/logger";
import { env } from "./config/env";
import { initializeServices } from "./config/initializeServices";
import {
  setupGracefulShutdown,
  setupErrorHandlers,
} from "./config/gracefulShutdown";

const startServer = async (): Promise<void> => {
  try {
    setupErrorHandlers();
    await initializeServices();

    const server = app.listen(env.PORT, () => {
      logger.info(`Battleship API running on port ${env.PORT}`, {
        port: env.PORT,
        environment: env.NODE_ENV,
      });
    });
    setupGracefulShutdown(server);
  } catch (error: any) {
    logger.error("Failed to start server", error);
    process.exit(1);
  }
};

startServer();
