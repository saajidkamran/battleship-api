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
  synchronize: process.env.NODE_ENV !== "production", // auto-sync entities in dev
  logging: process.env.NODE_ENV === "development",
  entities: [Game, Ship],

  // Connection timeout
  connectTimeout: 10000,
});
