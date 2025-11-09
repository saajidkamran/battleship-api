import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { Game } from "./Game";

@Entity()
export class Ship {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column("int")
  size!: number;

  // JSON column for positions
  @Column({ type: "json", nullable: false })
  positions!: string[];

  // ✅ FIX 1: Remove DEFAULT '[]' (MySQL disallows)
  // ✅ FIX 2: Give TypeScript an initializer or definite assignment
  @Column({ type: "json", nullable: false })
  hits: string[] = []; // <-- initializes to empty array

  @Column({ default: false })
  isSunk!: boolean;

  @ManyToOne(() => Game, (game) => game.ships, { onDelete: "CASCADE" })
  game!: Game;
}
