import { AppDataSource } from "../config/database";
import { Game } from "../models/Game";
import { Ship } from "../models/Ship";
import { placeShips } from "./shipPlacement";
import { createNotFoundError } from "../utils/errors";
import { randomUUID } from "crypto";
import { logger } from "../utils/logger";
import * as gameRepo from "../repositories/gameRepository";

export const startGame = async (): Promise<Game> => {
  const gameRepo = AppDataSource.getRepository(Game);

  // Create new game
  const game = new Game();
  game.id = randomUUID();
  game.status = "IN_PROGRESS";
  game.shots = [];

  // Create ships and attach to game
  const placedShips = placeShips().map((s) => {
    const ship = new Ship();
    ship.name = s.name;
    ship.size = s.positions.length;
    ship.positions = s.positions;
    ship.hits = [];
    ship.isSunk = false;
    ship.game = game;
    return ship;
  });

  game.ships = placedShips;

  // Save (cascade creates ships)
  await gameRepo.save(game);
  logger.info(`Game ${game.id} created with ${placedShips.length} ships`);
  return game;
};

export const getGame = async (id: string): Promise<Game> => {
  const gameRepo = AppDataSource.getRepository(Game);
  const game = await gameRepo.findOne({
    where: { id },
    relations: ["ships"],
  });

  if (!game) throw createNotFoundError("Game not found", { id });
  logger.info(`Recived Game ${game.id} `);

  return game;
};

export const fireAtCoordinate = async (gameId: string, coordinate: string) => {
  const gameRepo = AppDataSource.getRepository(Game);
  const shipRepo = AppDataSource.getRepository(Ship);

  const game = await gameRepo.findOne({
    where: { id: gameId },
    relations: ["ships"],
  });

  if (!game) throw new Error("Game not found");

  if (game.status === "WON") {
    return { message: "statusGame already won!" };
  }

  if (game.shots.includes(coordinate)) {
    return { message: "Coordinate already fired" };
  }

  game.shots.push(coordinate);
  let hit = false;
  let sunkShip: string | null = null;

  for (const ship of game.ships) {
    if (ship.positions.includes(coordinate)) {
      hit = true;
      ship.hits.push(coordinate);

      if (ship.hits.length >= ship.size) {
        ship.isSunk = true;
        sunkShip = ship.name;
      }

      await shipRepo.save(ship);
      break;
    }
  }

  const allSunk = game.ships.length > 0 && game.ships.every((s) => s.isSunk);

  if (allSunk) game.status = "WON";

  await gameRepo.save(game);
  if (hit) {
    logger.info(`Ship hit: ${coordinate} for Game ${game.id} `);
  } else {
    logger.info(`Ship miss: ${coordinate} for Game ${game.id} `);
  }
  return {
    coordinate,
    result: hit ? "hit" : "miss",
    sunk: sunkShip,
    gameStatus: game.status,
  };
};

export const getGames = async (
  status?: string,
  page: number = 1,
  limit: number = 10
) => {
  const allowedStatuses = ["IN_PROGRESS", "WON", "LOST"];
  
  if (status && !allowedStatuses.includes(status)) {
    throw new Error(`Invalid status value: ${status}`);
  }
  
  // Validate pagination parameters
  if (page < 1) {
    throw new Error("Page must be greater than 0");
  }
  if (limit < 1 || limit > 100) {
    throw new Error("Limit must be between 1 and 100");
  }
  
  logger.info(`Retrieved games`, { status, page, limit });

  return await gameRepo.getGamesByStatus(status, page, limit);
};
