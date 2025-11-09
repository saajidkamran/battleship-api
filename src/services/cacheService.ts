import { redisClient, isRedisConnected } from "../config/redis";
import { Game } from "../models/Game";
import { logger } from "../utils/logger";
import { PaginatedResult } from "../repositories/gameRepository";

// Cache key prefixes
const CACHE_KEYS = {
  GAME: (id: string) => `game:${id}`,
  GAMES_BY_STATUS: (status: string | undefined, page: number, limit: number) =>
    `games:status:${status || "all"}:page:${page}:limit:${limit}`,
  RECENT_GAMES: () => `games:recent`,
  IDEMPOTENCY: (key: string) => `idempotency:${key}`,
} as const;

// TTL (Time To Live) in seconds
const TTL = {
  ACTIVE_GAME: 3600, // 1 hour for active games
  COMPLETED_GAME: 86400, // 24 hours for completed games
  GAME_LIST: 300, // 5 minutes for game lists
  RECENT_GAMES: 60, // 1 minute for recent games
  IDEMPOTENCY: 86400, // 24 hours for idempotency keys
} as const;

/**
 * Convert Game object to plain object for serialization
 */
const gameToPlain = (game: Game): any => {
  return {
    id: game.id,
    status: game.status,
    shots: game.shots,
    createdAt: game.createdAt.toISOString(),
    ships: game.ships?.map((ship) => ({
      id: ship.id,
      name: ship.name,
      size: ship.size,
      positions: ship.positions,
      hits: ship.hits,
      isSunk: ship.isSunk,
    })) || [],
  };
};

/**
 * Convert plain object to Game object
 * Note: This returns a plain object with Game structure, not a full TypeORM entity
 * For caching purposes, this is sufficient as we only need the data
 */
const plainToGame = (data: any): Game => {
  const game = Object.assign(new Game(), {
    id: data.id,
    status: data.status,
    shots: data.shots || [],
    createdAt: new Date(data.createdAt),
    ships: data.ships || [],
  });
  return game;
};

/**
 * Get TTL based on game status
 */
const getGameTTL = (status: string): number => {
  return status === "IN_PROGRESS" ? TTL.ACTIVE_GAME : TTL.COMPLETED_GAME;
};

/**
 * Cache a single game
 */
export const cacheGame = async (game: Game): Promise<void> => {
  if (!isRedisConnected()) {
    return;
  }

  try {
    const key = CACHE_KEYS.GAME(game.id);
    const plainGame = gameToPlain(game);
    const value = JSON.stringify(plainGame);
    const ttl = getGameTTL(game.status);

    await redisClient.setex(key, ttl, value);
    logger.debug(`Cached game: ${game.id}`, { ttl });
  } catch (error:any) {
    logger.warn("Failed to cache game", error);
    // Don't throw - cache failures shouldn't break the app
  }
};

/**
 * Get a single game from cache
 */
export const getCachedGame = async (id: string): Promise<Game | null> => {
  if (!isRedisConnected()) {
    return null;
  }

  try {
    const key = CACHE_KEYS.GAME(id);
    const data = await redisClient.get(key);

    if (!data) {
      return null;
    }

    const parsed = JSON.parse(data);
    const game = plainToGame(parsed);
    logger.debug(`Cache hit for game: ${id}`);
    return game;
  } catch (error:any) {
    logger.warn("Failed to get game from cache", error);
    return null;
  }
};

/**
 * Invalidate (delete) a game from cache
 */
export const invalidateGame = async (id: string): Promise<void> => {
  if (!isRedisConnected()) {
    return;
  }

  try {
    const key = CACHE_KEYS.GAME(id);
    await redisClient.del(key);
    logger.debug(`Invalidated game cache: ${id}`);
  } catch (error:any) {
    logger.warn("Failed to invalidate game cache", error);
  }
};

/**
 * Invalidate all game list caches (called when games are created/updated/deleted)
 */
export const invalidateGameLists = async (): Promise<void> => {
  if (!isRedisConnected()) {
    return;
  }

  try {
    // Get all keys matching the pattern
    const pattern = "games:status:*";
    const keys = await redisClient.keys(pattern);
    const recentGamesKey = CACHE_KEYS.RECENT_GAMES();

    if (keys.length > 0) {
      await redisClient.del(...keys);
    }
    await redisClient.del(recentGamesKey);

    logger.debug(`Invalidated ${keys.length} game list cache(s)`);
  } catch (error:any) {
    logger.warn("Failed to invalidate game list cache", error);
  }
};

/**
 * Cache paginated game list
 */
export const cacheGameList = async (
  status: string | undefined,
  page: number,
  limit: number,
  result: PaginatedResult<Game>
): Promise<void> => {
  if (!isRedisConnected()) {
    return;
  }

  try {
    const key = CACHE_KEYS.GAMES_BY_STATUS(status, page, limit);
    // Convert games to plain objects
    const plainGames = result.data.map((game) => gameToPlain(game));
    const value = JSON.stringify({
      data: plainGames,
      pagination: result.pagination,
    });

    await redisClient.setex(key, TTL.GAME_LIST, value);
    logger.debug(`Cached game list`, { status, page, limit });
  } catch (error:any) {
    logger.warn("Failed to cache game list", error);
  }
};

/**
 * Get paginated game list from cache
 */
export const getCachedGameList = async (
  status: string | undefined,
  page: number,
  limit: number
): Promise<PaginatedResult<Game> | null> => {
  if (!isRedisConnected()) {
    return null;
  }

  try {
    const key = CACHE_KEYS.GAMES_BY_STATUS(status, page, limit);
    const data = await redisClient.get(key);

    if (!data) {
      return null;
    }

    const parsed = JSON.parse(data);
    // Convert plain objects to Game objects
    const result: PaginatedResult<Game> = {
      data: parsed.data.map((plainGame: any) => plainToGame(plainGame)),
      pagination: parsed.pagination,
    };

    logger.debug(`Cache hit for game list`, { status, page, limit });
    return result;
  } catch (error:any) {
    logger.warn("Failed to get game list from cache", error);
    return null;
  }
};

/**
 * Cache recent games
 */
export const cacheRecentGames = async (games: Game[]): Promise<void> => {
  if (!isRedisConnected()) {
    return;
  }

  try {
    const key = CACHE_KEYS.RECENT_GAMES();
    const plainGames = games.map((game) => gameToPlain(game));
    const value = JSON.stringify(plainGames);

    await redisClient.setex(key, TTL.RECENT_GAMES, value);
    logger.debug(`Cached recent games`, { count: games.length });
  } catch (error:any) {
    logger.warn("Failed to cache recent games", error);
  }
};

/**
 * Get recent games from cache
 */
export const getCachedRecentGames = async (): Promise<Game[] | null> => {
  if (!isRedisConnected()) {
    return null;
  }

  try {
    const key = CACHE_KEYS.RECENT_GAMES();
    const data = await redisClient.get(key);

    if (!data) {
      return null;
    }

    const parsed = JSON.parse(data);
    const games = parsed.map((plainGame: any) => plainToGame(plainGame));
    logger.debug(`Cache hit for recent games`);
    return games;
  } catch (error:any) {
    logger.warn("Failed to get recent games from cache", error);
    return null;
  }
};

/**
 * Cache idempotency response
 */
export const cacheIdempotency = async (key: string, response: unknown): Promise<void> => {
  if (!isRedisConnected()) {
    return;
  }

  try {
    const cacheKey = CACHE_KEYS.IDEMPOTENCY(key);
    const value = JSON.stringify(response);
    await redisClient.setex(cacheKey, TTL.IDEMPOTENCY, value);
    logger.debug(`Cached idempotency response: ${key}`);
  } catch (error:any) {
    logger.warn("Failed to cache idempotency response", error);
  }
};

/**
 * Get idempotency response from cache
 */
export const getCachedIdempotency = async (key: string): Promise<unknown | null> => {
  if (!isRedisConnected()) {
    return null;
  }

  try {
    const cacheKey = CACHE_KEYS.IDEMPOTENCY(key);
    const data = await redisClient.get(cacheKey);

    if (!data) {
      return null;
    }

    const response = JSON.parse(data);
    logger.debug(`Cache hit for idempotency key: ${key}`);
    return response;
  } catch (error:any) {
    logger.warn("Failed to get idempotency from cache", error);
    return null;
  }
};

/**
 * Clear a specific idempotency key (admin/maintenance function)
 * Note: Normally, idempotency keys expire automatically after 24 hours.
 * This function is only needed for manual cleanup or maintenance.
 */
export const clearIdempotencyKey = async (key: string): Promise<void> => {
  if (!isRedisConnected()) {
    return;
  }

  try {
    const cacheKey = CACHE_KEYS.IDEMPOTENCY(key);
    await redisClient.del(cacheKey);
    logger.debug(`Cleared idempotency key: ${key}`);
  } catch (error:any) {
    logger.warn("Failed to clear idempotency key", error);
  }
};

/**
 * Clear all idempotency keys (admin/maintenance function)
 * Note: Use with caution! This clears all idempotency keys.
 * Normally, keys expire automatically after 24 hours.
 * This function is only needed for maintenance or debugging.
 */
export const clearAllIdempotencyKeys = async (): Promise<number> => {
  if (!isRedisConnected()) {
    return 0;
  }

  try {
    const pattern = "idempotency:*";
    const keys = await redisClient.keys(pattern);
    
    if (keys.length > 0) {
      await redisClient.del(...keys);
      logger.info(`Cleared ${keys.length} idempotency keys`);
      return keys.length;
    }
    
    return 0;
  } catch (error:any) {
    logger.warn("Failed to clear all idempotency keys", error);
    return 0;
  }
};

/**
 * Get TTL (Time To Live) of an idempotency key
 * Returns seconds until expiration, or -1 if key doesn't exist or Redis is not connected
 */
export const getIdempotencyKeyTTL = async (key: string): Promise<number> => {
  if (!isRedisConnected()) {
    return -1;
  }

  try {
    const cacheKey = CACHE_KEYS.IDEMPOTENCY(key);
    const ttl = await redisClient.ttl(cacheKey);
    return ttl;
  } catch (error:any) {
    logger.warn("Failed to get idempotency key TTL", error);
    return -1;
  }
};

