import "reflect-metadata";
import { DataSource } from "typeorm";
import { Game } from "../models/Game";
import { Ship } from "../models/Ship";

export const AppDataSource = new DataSource({
  type: "mysql",
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  username: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "root",
  database: process.env.DB_NAME || "battleship",
  synchronize: process.env.NODE_ENV !== "production",
  logging: process.env.NODE_ENV === "development",
  entities: [Game, Ship],

  // Connection timeout
  connectTimeout: 10000,

  // Production-ready connection pool configuration
  extra: {
    connectionLimit: parseInt(process.env.DB_POOL_SIZE || "10", 10),
    acquireTimeout: 60000, // 60 seconds
    timeout: 60000, // 60 seconds
    // Enable SSL in production if DB_SSL is set
    ...(process.env.NODE_ENV === "production" && process.env.DB_SSL === "true"
      ? {
          ssl: {
            rejectUnauthorized:
              process.env.DB_SSL_REJECT_UNAUTHORIZED !== "false",
          },
        }
      : {}),
  },
  // Maximum number of connections in pool
  poolSize: parseInt(process.env.DB_POOL_SIZE || "10", 10),
  // Log slow queries (>5 seconds) in production
  maxQueryExecutionTime:
    process.env.NODE_ENV === "production" ? 5000 : undefined,
});
