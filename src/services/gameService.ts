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

export const fireAtCoordinate = (gameId: string, coordinate: string) => {
  const game = games.get(gameId);
  if (!game) throw new Error("Game not found");
  if (game.status === "WON") return { message: "Congratulations! You have already won" };

  // Prevent duplicate shots
  if (game.shots.includes(coordinate)) {
    return { message: "Coordinate already fired", coordinate };
  }

  game.shots.push(coordinate);

  let hit = false;
  let sunkShip: string | null = null;

  for (const ship of game.ships) {
    if (ship.positions.includes(coordinate)) {
      hit = true;
      ship.hits.push(coordinate);
      if (ship.hits.length === ship.size) {
        ship.isSunk = true;
        sunkShip = ship.name;
      }
      break;
    }
  }

  // Check if all ships are sunk
  const allSunk = game.ships.every((s) => s.isSunk);
  if (allSunk) {
    game.status = "WON";
  }

  return {
    coordinate,
    result: hit ? "hit" : "miss",
    sunk: sunkShip,
    gameStatus: game.status,
  };
};
// --- test hooks (only used by Jest) ---
export const __test__ = {
  _games: () => games,
  _reset: () => games.clear()
};
