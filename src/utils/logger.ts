// Production-ready logger using Pino
import pino from "pino";
import { env } from "../config/env";

// Create Pino logger instance
const pinoLogger = pino({
  level: process.env.LOG_LEVEL || (env.NODE_ENV === "production" ? "info" : "debug"),
  transport:
    env.NODE_ENV === "development"
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "HH:MM:ss Z",
            ignore: "pid,hostname",
          },
        }
      : undefined, // Use JSON output in production
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

// Wrapper to maintain the same API interface
const logError = (
  message: string,
  error?: Error | unknown,
  meta?: Record<string, unknown>
): void => {
  const logData: Record<string, unknown> = { ...meta };

  if (error instanceof Error) {
    logData.err = {
      name: error.name,
      message: error.message,
      stack: env.NODE_ENV === "development" ? error.stack : undefined,
      ...(error as { code?: string; statusCode?: number }),
    };
  } else if (error) {
    logData.err = { message: String(error) };
  }

  pinoLogger.error(logData, message);
};

const logWarn = (message: string, meta?: Record<string, unknown>): void => {
  pinoLogger.warn(meta || {}, message);
};

const logInfo = (message: string, meta?: Record<string, unknown>): void => {
  pinoLogger.info(meta || {}, message);
};

const logDebug = (message: string, meta?: Record<string, unknown>): void => {
  if (env.NODE_ENV === "development" || process.env.LOG_LEVEL === "debug") {
    pinoLogger.debug(meta || {}, message);
  }
};

// Export logger with the same interface as before
export const logger = {
  error: logError,
  warn: logWarn,
  info: logInfo,
  debug: logDebug,
};

// Export the underlying Pino logger for advanced usage if needed
export const pinoLoggerInstance = pinoLogger;
