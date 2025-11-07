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

export const fire = (req: Request, res: Response, next: NextFunction) => {
  try {
    // TODO:Validate the id is valid 
    const { id } = req.params;
    // TODO:Sanitize the id is valid 
    const { coordinate } = req.body;

    const result = gameService.fireAtCoordinate(id, coordinate);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export const getGameState = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const game = gameService.getGame(id);
    if (!game) return res.status(404).json({ error: "Game not found" });
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
