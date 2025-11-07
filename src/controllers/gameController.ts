// # Handles HTTP requests/responses
import { Request, Response, NextFunction } from "express";
import * as gameService from "../services/gameService";

export const startGame = (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log("Starting new game...")
    const game = gameService.startGame();
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
