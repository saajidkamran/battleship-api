import { Ship } from "../../utils/gameTypes";


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


export const mockPlaceShips = () => mockShips;


export interface GameServiceFunctions {
  fireAtCoordinate: (gameId: string, coordinate: string) => any;
  startGame: () => any;
  getGame: (id: string) => any;
}


export const setupIsolatedGameService = (): GameServiceFunctions => {
  jest.isolateModules(() => {
    jest.mock("../../services/shipPlacement", () => ({
      placeShips: mockPlaceShips,
    }));
  });

  const service = require("../../services/gameService");
  
  return {
    fireAtCoordinate: service.fireAtCoordinate,
    startGame: service.startGame,
    getGame: service.getGame,
  };
};

