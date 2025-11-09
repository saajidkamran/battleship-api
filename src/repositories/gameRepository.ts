// Database logic (SQLite or in-memory)
import { AppDataSource } from "../config/database";
import { Game } from "../models/Game";

const gameRepo = AppDataSource.getRepository(Game);

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export const getGamesByStatus = async (
  status?: string,
  page: number = 1,
  limit: number = 10
): Promise<PaginatedResult<Game>> => {
  const where = status ? { status } : {};
  
  // Calculate skip for pagination
  const skip = (page - 1) * limit;
  
  // Get total count
  const total = await gameRepo.count({ where });
  
  // Get paginated results
  const data = await gameRepo.find({
    where,
    relations: ["ships"],
    order: { id: "DESC" },
    skip,
    take: limit,
  });
  
  // Calculate pagination metadata
  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;
  
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext,
      hasPrev,
    },
  };
};


export const getRecentGames = async (): Promise<Game[]> => {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return await gameRepo
    .createQueryBuilder("game")
    .leftJoinAndSelect("game.ships", "ships")
    .where("game.status = :status", { status: "IN_PROGRESS" })
    .andWhere("game.createdAt > :date", { date: twentyFourHoursAgo })
    .orderBy("game.createdAt", "DESC")
    .getMany();
};
