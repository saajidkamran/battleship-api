// src/controllers/gameController.ts
import { Request, Response, NextFunction } from "express";
import * as gameService from "../services/gameService";
import { createNotFoundError } from "../utils/errors";
import { logger } from "../utils/logger";

export const startGame = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    logger.info("Starting new game", { requestId: req.requestId });

    const game = await gameService.startGame();
    res.status(201).json({
      message: "New game started.",
      gameId: game.id,
      gridSize: "10x10",
      shipsCount: game.ships.length,
    });
  } catch (err) {
    next(err);
  }
};

export const fire = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { coordinate } = req.body;

    logger.info("Firing at coordinate", {
      requestId: req.requestId,
      gameId: id,
      coordinate,
    });
    const result = await gameService.fireAtCoordinate(id, coordinate);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export const getGameState = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const game = await gameService.getGame(id);
    if (!game) {
      throw createNotFoundError("Game not found", { gameId: id });
    }
    res.json({
      gameId: game.id,
      status: game.status,
      shots: game.shots,
      remainingShips: game.ships.filter((s) => !s.isSunk).length,
    });
  } catch (err) {
    next(err);
  }
};
