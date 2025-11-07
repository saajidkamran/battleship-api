//  # Core game logic (ship placement, hit/miss)
import { Game } from "../models/gameTypes";
import { placeShips } from "../utils/shipPlacement";
import { randomUUID } from "crypto";

const games: Map<string, Game> = new Map();

export const startGame = (): Game => {
  const id = randomUUID();
  const ships = placeShips();

  const newGame: Game = {
    id,
    status: "IN_PROGRESS",
    ships,
    shots: [],
  };

  games.set(id, newGame);
  return newGame;
};

export const getGame = (id: string): Game | undefined => {
  return games.get(id);
};
