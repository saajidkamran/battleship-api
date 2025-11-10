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

  @Column({ type: "json", nullable: false })
  hits: string[] = [];

  @Column({ default: false })
  isSunk!: boolean;

  @ManyToOne(() => Game, (game) => game.ships, { onDelete: "CASCADE" })
  game!: Game;
}
