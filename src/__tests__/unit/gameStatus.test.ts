describe("Game status - using jest.isolateModules", () => {
  let fireAtCoordinate: any;
  let startGame: any;
  let getGame: any;

  beforeEach(() => {
    jest.isolateModules(() => {
      jest.mock("../../utils/shipPlacement", () => ({
        placeShips: () => [
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
            name: "Destroyer1",
            size: 1,
            positions: ["B1"],
            hits: [],
            isSunk: false,
          },
          {
            id: "3",
            name: "Destroyer2",
            size: 1,
            positions: ["C1"],
            hits: [],
            isSunk: false,
          },
        ],
      }));

      const service = require("../../services/gameService");
      fireAtCoordinate = service.fireAtCoordinate;
      startGame = service.startGame;
      getGame = service.getGame;
    });
  });

  it("should return IN_PROGRESS after starting a game", () => {
    const game = startGame();
    const fetched = getGame(game.id);

    expect(fetched).toBeDefined();
    expect(fetched.status).toBe("IN_PROGRESS");
  });

  it("should remain IN_PROGRESS after a single shot", () => {
    const game = startGame();
    const target = game.ships[0].positions[0];

    fireAtCoordinate(game.id, target);
    const updated = getGame(game.id);

    expect(updated.status).toBe("IN_PROGRESS");
  });

  it("should become WON after all ships are sunk", () => {
    const game = startGame();

    // fire at every ship position
    for (const ship of game.ships) {
      for (const pos of ship.positions) {
        fireAtCoordinate(game.id, pos);
      }
    }

    const finalGame = getGame(game.id);
    expect(finalGame.status).toBe("WON");
  });

  it("should return undefined for a non-existent game ID", () => {
    const missing = getGame("fake-id");
    expect(missing).toBeUndefined();
  });
});
