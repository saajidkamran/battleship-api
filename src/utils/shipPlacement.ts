import { Ship } from "../models/gameTypes";

const ROWS = "ABCDEFGHIJ".split("");

export function placeShips(): Ship[] {
  const fleet = [
    { name: "Battleship", size: 5 },
    { name: "Destroyer", size: 4 },
    { name: "Destroyer", size: 4 },
  ];
  const occupied = new Set<string>();
  const ships: Ship[] = [];

  for (const ship of fleet) {
    let placed = false;

    while (!placed) {
      const orientation = Math.random() < 0.5 ? "H" : "V";
      const rowIndex = Math.floor(Math.random() * 10);
      const colIndex = Math.floor(Math.random() * 10);
      const coords: string[] = [];

      for (let i = 0; i < ship.size; i++) {
        const r = orientation === "H" ? rowIndex : rowIndex + i;
        const c = orientation === "H" ? colIndex + i : colIndex;
        if (r >= 10 || c >= 10) break;
        coords.push(`${ROWS[r]}${c + 1}`);
      }

      if (
        coords.length === ship.size &&
        coords.every((c) => !occupied.has(c))
      ) {
        coords.forEach((c) => occupied.add(c));
        ships.push({
          id: crypto.randomUUID(),
          name: ship.name as "Battleship" | "Destroyer",
          size: ship.size,
          positions: coords,
          hits: [],
          isSunk: false,
        });
        placed = true;
      }
    }
  }

  return ships;
}
