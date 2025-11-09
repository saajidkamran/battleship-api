// Environment variable validation
interface EnvConfig {
  PORT: number;
  NODE_ENV: "development" | "production" | "test";
  CORS_ORIGIN?: string;
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

  return {
    PORT: port,
    NODE_ENV: nodeEnv,
    CORS_ORIGIN: process.env.CORS_ORIGIN,
  };
};

export const env = getEnvConfig();

