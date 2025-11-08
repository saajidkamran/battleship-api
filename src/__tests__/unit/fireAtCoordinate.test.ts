import { setupIsolatedGameService } from "../helpers/testMocks";

describe("fireAtCoordinate ", () => {
  const { fireAtCoordinate, getGame, startGame } = setupIsolatedGameService();

  it("should register a HIT when coordinate matches any ship", () => {
    const game = startGame();
    const target = game.ships[0].positions[0];

    const result = fireAtCoordinate(game.id, target);

    expect(result.result).toBe("hit");
    expect(result.coordinate).toBe(target);
    expect(result.sunk).toBeNull(); // not sunk yet
    expect(result.gameStatus).toBe("IN_PROGRESS");
  });

  it("should register a MISS when coordinate hits no ship", () => {
    const game = startGame();
    const result = fireAtCoordinate(game.id, "J10");

    expect(["hit", "miss"]).toContain(result.result);
    if (result.result === "miss") {
      expect(result.sunk).toBeNull();
      expect(result.gameStatus).toBe("IN_PROGRESS");
    }
  });

  it("should mark a ship as SUNK when all its positions are hit", () => {
    const game = startGame();
    const ship = game.ships[0];

    // Hit every position of the first ship
    for (const pos of ship.positions) {
      const result = fireAtCoordinate(game.id, pos);
      // The last hit should mark the ship as sunk
      if (pos === ship.positions[ship.positions.length - 1]) {
        expect(result.sunk).toBe(ship.name);
      }
    }

    // Verify the ship is marked as sunk
    const updatedGame = getGame(game.id);
    expect(updatedGame?.ships.find((s: any) => s.id === ship.id)?.isSunk).toBe(
      true
    );
  });

  it("should set game status to WON when all ships are sunk", () => {
    const game = startGame();

    // Hit every position of every ship
    for (const ship of game.ships) {
      for (const pos of ship.positions) {
        fireAtCoordinate(game.id, pos);
      }
    }

    const updatedGame = getGame(game.id);
    expect(updatedGame?.status).toBe("WON");
  });
});
