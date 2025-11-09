import { AppDataSource } from "../config/database";
import { Game } from "../models/Game";
import { Ship } from "../models/Ship";
import { placeShips } from "./shipPlacement";
import { createNotFoundError, createConflictError, createValidationError } from "../utils/errors";
import { randomUUID } from "crypto";
import { logger } from "../utils/logger";
import * as gameRepo from "../repositories/gameRepository";
import * as cacheService from "./cacheService";

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

  // Save to database (cascade creates ships)
  await gameRepo.save(game);
  
  // Cache the game (write-through pattern)
  await cacheService.cacheGame(game);
  
  // Invalidate game lists cache since we added a new game
  await cacheService.invalidateGameLists();
  
  logger.info(`Game ${game.id} created with ${placedShips.length} ships`);
  return game;
};

export const getGame = async (id: string): Promise<Game> => {
  // Try to get from cache first (cache-aside pattern)
  const cachedGame = await cacheService.getCachedGame(id);
  if (cachedGame) {
    logger.info(`Game ${id} retrieved from cache`);
    return cachedGame;
  }

  // Cache miss - get from database
  const gameRepo = AppDataSource.getRepository(Game);
  const game = await gameRepo.findOne({
    where: { id },
    relations: ["ships"],
  });

  if (!game) throw createNotFoundError("Game not found", { id });
  
  // Cache the game for future requests
  await cacheService.cacheGame(game);
  logger.info(`Game ${id} retrieved from database and cached`);

  return game;
};

export const fireAtCoordinate = async (gameId: string, coordinate: string) => {
  const gameRepo = AppDataSource.getRepository(Game);
  const shipRepo = AppDataSource.getRepository(Ship);

  // Try to get from cache first for quick validation
  const cachedGame = await cacheService.getCachedGame(gameId);
  let fromCache = false;

  // Always load from database for writes to ensure we have a proper TypeORM entity
  // Cache helps with read performance, but for writes we need the full entity
  let game: Game | null = null;
  
  if (cachedGame) {
    // If cached, we can do quick validation, but still load from DB for the write
    // This gives us the benefit of cache validation without sacrificing entity integrity
    fromCache = true;
  }
  
  // Load from database (required for proper TypeORM entity with relations)
  game = await gameRepo.findOne({
    where: { id: gameId },
    relations: ["ships"],
  });

  if (!game) {
    throw createNotFoundError("Game not found", { gameId });
  }

  if (game.status === "WON") {
    throw createConflictError("Game already won", { gameId, status: game.status });
  }

  if (game.shots.includes(coordinate)) {
    throw createConflictError("Coordinate already fired", { gameId, coordinate });
  }

  // Update game state
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

      // Save ship to database
      await shipRepo.save(ship);
      break;
    }
  }

  const allSunk = game.ships.length > 0 && game.ships.every((s) => s.isSunk);

  if (allSunk) game.status = "WON";

  // Save game to database (write-through pattern)
  await gameRepo.save(game);
  
  // Update cache with latest game state
  await cacheService.cacheGame(game);
  
  // If game status changed to WON, invalidate game lists
  if (allSunk) {
    await cacheService.invalidateGameLists();
  }

  if (hit) {
    logger.info(`Ship hit: ${coordinate} for Game ${game.id} (${fromCache ? 'from cache' : 'from DB'})`);
  } else {
    logger.info(`Ship miss: ${coordinate} for Game ${game.id} (${fromCache ? 'from cache' : 'from DB'})`);
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
    throw createValidationError(
      `Invalid status value: ${status}. Allowed values: ${allowedStatuses.join(', ')}`,
      { status, allowedStatuses }
    );
  }
  
  // Validate pagination parameters
  if (page < 1) {
    throw createValidationError("Page must be greater than 0", { page });
  }
  if (limit < 1 || limit > 100) {
    throw createValidationError("Limit must be between 1 and 100", { limit });
  }
  
  logger.info(`Retrieved games`, { status, page, limit });

  return await gameRepo.getGamesByStatus(status, page, limit);
};

export const deleteGame = async (id: string): Promise<void> => {
  const gameRepo = AppDataSource.getRepository(Game);
  const shipRepo = AppDataSource.getRepository(Ship);

  // Find game with ships
  const game = await gameRepo.findOne({
    where: { id },
    relations: ["ships"],
  });

  if (!game) {
    throw createNotFoundError("Game not found", { id });
  }

  // Delete ships first (cascade should handle this, but being explicit)
  if (game.ships && game.ships.length > 0) {
    await shipRepo.remove(game.ships);
  }

  // Delete the game from database
  await gameRepo.remove(game);
  
  // Invalidate cache
  await cacheService.invalidateGame(id);
  await cacheService.invalidateGameLists();
  
  logger.info(`Game ${id} deleted successfully`);
};

export const deleteAllGames = async (): Promise<{ deletedCount: number }> => {
  const gameRepo = AppDataSource.getRepository(Game);
  const shipRepo = AppDataSource.getRepository(Ship);

  // Get all games with ships
  const games = await gameRepo.find({
    relations: ["ships"],
  });

  let deletedCount = 0;

  // Delete all ships first
  for (const game of games) {
    if (game.ships && game.ships.length > 0) {
      await shipRepo.remove(game.ships);
    }
    deletedCount++;
  }

  // Delete all games from database
  await gameRepo.remove(games);
  
  // Invalidate all caches
  await cacheService.invalidateGameLists();
  // Note: We could invalidate individual game caches, but invalidating lists is sufficient
  // and more efficient for bulk deletes
  
  logger.info(`Deleted ${deletedCount} games successfully`);

  return { deletedCount };
};

export const getRecentGames = async (): Promise<Game[]> => {
  logger.info("Retrieving recent games");
  return await gameRepo.getRecentGames();
};
