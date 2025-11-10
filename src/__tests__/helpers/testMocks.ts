// Shared test mocks and utilities
import { Ship } from "../../utils/gameTypes";

/**
 * Mock ships data for testing
 * Used to create deterministic test scenarios
 * Matches the integration test requirements: Battleship (A1, A2), Destroyer (B1, B2, B3), Submarine (C1)
 */
export const mockShips: Ship[] = [
  {
    id: "1",
    name: "Battleship",
    size: 2,
    positions: ["A1", "A2"],
    hits: [],
    isSunk: false,
  },
  {
    id: "2",
    name: "Destroyer",
    size: 1,
    positions: ["B1"],
    hits: [],
    isSunk: false,
  },
  {
    id: "3",
    name: "Destroyer",
    size: 1,
    positions: ["C1"],
    hits: [],
    isSunk: false,
  },
];

/**
 * Mock function for placeShips used in tests
 * Returns deterministic ship positions for testing
 */
export const mockPlaceShips = () => mockShips;

/**
 * Game service functions type
 * Using 'any' for test helpers to avoid TypeScript issues with dynamic requires
 */
export interface GameServiceFunctions {
  fireAtCoordinate: (gameId: string, coordinate: string) => any;
  startGame: () => any;
  getGame: (id: string) => any;
}

/**
 * Sets up isolated modules with mocked ship placement
 * Returns the game service functions for testing
 */
export const setupIsolatedGameService = (): GameServiceFunctions => {
  jest.isolateModules(() => {
    jest.mock("../../services/shipPlacement", () => ({
      placeShips: mockPlaceShips,
    }));
  });

  // Load the service after mocking
  const service = require("../../services/gameService");
  
  return {
    fireAtCoordinate: service.fireAtCoordinate,
    startGame: service.startGame,
    getGame: service.getGame,
  };
};

