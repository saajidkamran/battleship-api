// Environment variable validation
interface EnvConfig {
  PORT: number;
  NODE_ENV: "development" | "production" | "test";
  CORS_ORIGIN?: string;
  REDIS_HOST?: string;
  REDIS_PORT?: number;
  REDIS_PASSWORD?: string;
  REDIS_DB?: number;
  DB_POOL_SIZE?: number;
  DB_SSL?: string;
}

const getEnvConfig = (): EnvConfig => {
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  
  if (isNaN(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be a valid number between 1 and 65535");
  }

  const nodeEnv = (process.env.NODE_ENV || "development") as EnvConfig["NODE_ENV"];
  if (!["development", "production", "test"].includes(nodeEnv)) {
    throw new Error("NODE_ENV must be one of: development, production, test");
  }

  // Validate required production variables
  if (nodeEnv === "production") {
    const required = ["DB_HOST", "DB_USER", "DB_PASS", "DB_NAME"];
    const missing = required.filter(key => !process.env[key]);
    if (missing.length > 0) {
      throw new Error(
        `Missing required environment variables for production: ${missing.join(", ")}`
      );
    }
  }

  return {
    PORT: port,
    NODE_ENV: nodeEnv,
    CORS_ORIGIN: process.env.CORS_ORIGIN,
    REDIS_HOST: process.env.REDIS_HOST,
    REDIS_PORT: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : undefined,
    REDIS_PASSWORD: process.env.REDIS_PASSWORD,
    REDIS_DB: process.env.REDIS_DB ? parseInt(process.env.REDIS_DB, 10) : undefined,
    DB_POOL_SIZE: process.env.DB_POOL_SIZE ? parseInt(process.env.DB_POOL_SIZE, 10) : undefined,
    DB_SSL: process.env.DB_SSL,
  };
};

export const env = getEnvConfig();

