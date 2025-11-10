import { placeShips } from "../../services/shipPlacement";

describe("placeShips()", () => {
  it("should not place overlapping ships", () => {
    const ships = placeShips();
    const allCoords = ships.flatMap((s) => s.positions);
    const uniqueCoords = new Set(allCoords);

    expect(uniqueCoords.size).toBe(allCoords.length);
  });

  it("should generate valid coordinates", () => {
    const coordRegex = /^[A-J](10|[1-9])$/;
    const ships = placeShips();

    for (const s of ships) {
      for (const pos of s.positions) {
        expect(coordRegex.test(pos)).toBe(true);
      }
    }
  });

  it("should produce the correct number of ships", () => {
    const ships = placeShips();
    expect(ships.length).toBe(3); // Battleship + 2 Destroyers
  });
});
