// # TypeScript interfaces & entity types
export interface Coordinate {
  row: string; // 'A' - 'J'
  col: number; // 1 - 10
}

export interface Ship {
  id: string;
  name: "Battleship" | "Destroyer";
  size: number;
  positions: string[]; // e.g., ["A1","A2","A3"]
  hits: string[];
  isSunk: boolean;
}

export interface Game {
  id: string;
  status: "IN_PROGRESS" | "WON";
  ships: Ship[];
  shots: string[];
}
