//  # Entry point (start server)// src/index.ts
import app from "./app";
import { logger } from "./utils/logger";
import { env } from "./config/env";

const server = app.listen(env.PORT, () => {
  logger.info(`Battleship API running on port ${env.PORT}`, { 
    port: env.PORT,
    environment: env.NODE_ENV,
  });
});

// Graceful shutdown handling
const gracefulShutdown = (signal: string) => {
  logger.info(`Received ${signal}, starting graceful shutdown...`);
  
  server.close(() => {
    logger.info("Server closed successfully");
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
