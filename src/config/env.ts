interface EnvConfig {
  PORT: number;
  NODE_ENV: "development" | "production" | "test";
  CORS_ORIGIN?: string;
  REDIS_HOST?: string;
  REDIS_PORT?: number;
  REDIS_PASSWORD?: string;
  REDIS_DB?: number;
  DB_HOST?: string;
  DB_PORT?: number;
  DB_USER?: string;
  DB_PASS?: string;
  DB_NAME?: string;
  DB_POOL_SIZE?: number;
  DB_SSL?: string;
  LOG_LEVEL?: string;
}

const getEnvConfig = (): EnvConfig => {
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  if (isNaN(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be a valid number between 1 and 65535");
  }

  const nodeEnv = (process.env.NODE_ENV ||
    "development") as EnvConfig["NODE_ENV"];
  if (!["development", "production", "test"].includes(nodeEnv)) {
    throw new Error("NODE_ENV must be one of: development, production, test");
  }

  // Validate database configuration
  const dbPort = process.env.DB_PORT
    ? parseInt(process.env.DB_PORT, 10)
    : undefined;
  if (dbPort !== undefined && (isNaN(dbPort) || dbPort < 1 || dbPort > 65535)) {
    throw new Error("DB_PORT must be a valid number between 1 and 65535");
  }

  // Validate Redis port
  const redisPort = process.env.REDIS_PORT
    ? parseInt(process.env.REDIS_PORT, 10)
    : undefined;
  if (
    redisPort !== undefined &&
    (isNaN(redisPort) || redisPort < 1 || redisPort > 65535)
  ) {
    throw new Error("REDIS_PORT must be a valid number between 1 and 65535");
  }

  // Validate database pool size
  const dbPoolSize = process.env.DB_POOL_SIZE
    ? parseInt(process.env.DB_POOL_SIZE, 10)
    : undefined;
  if (dbPoolSize !== undefined && (isNaN(dbPoolSize) || dbPoolSize < 1)) {
    throw new Error("DB_POOL_SIZE must be a positive integer");
  }

  // Validate Redis DB number
  const redisDb = process.env.REDIS_DB
    ? parseInt(process.env.REDIS_DB, 10)
    : undefined;
  if (redisDb !== undefined && (isNaN(redisDb) || redisDb < 0)) {
    throw new Error("REDIS_DB must be a non-negative integer");
  }

  // Validate LOG_LEVEL
  const logLevel = process.env.LOG_LEVEL;
  if (
    logLevel &&
    !["debug", "info", "warn", "error", "fatal"].includes(logLevel.toLowerCase())
  ) {
    throw new Error(
      "LOG_LEVEL must be one of: debug, info, warn, error, fatal"
    );
  }

  // Validate required production variables
  if (nodeEnv === "production") {
    const required = ["DB_HOST", "DB_USER", "DB_PASS", "DB_NAME"];
    const missing = required.filter((key) => !process.env[key]);
    if (missing.length > 0) {
      throw new Error(
        `Missing required environment variables for production: ${missing.join(
          ", "
        )}`
      );
    }
  }

  return {
    PORT: port,
    NODE_ENV: nodeEnv,
    CORS_ORIGIN: process.env.CORS_ORIGIN,
    REDIS_HOST: process.env.REDIS_HOST,
    REDIS_PORT: redisPort,
    REDIS_PASSWORD: process.env.REDIS_PASSWORD,
    REDIS_DB: redisDb,
    DB_HOST: process.env.DB_HOST,
    DB_PORT: dbPort,
    DB_USER: process.env.DB_USER,
    DB_PASS: process.env.DB_PASS,
    DB_NAME: process.env.DB_NAME,
    DB_POOL_SIZE: dbPoolSize,
    DB_SSL: process.env.DB_SSL,
    LOG_LEVEL: logLevel,
  };
};

export const env = getEnvConfig();
