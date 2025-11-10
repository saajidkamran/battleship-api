import {
  Entity,
  PrimaryColumn,
  Column,
  OneToMany,
  CreateDateColumn,
} from "typeorm";
import { Ship } from "./Ship";

@Entity()
export class Game {
  @PrimaryColumn({ type: "varchar", length: 36 })
  id!: string;

  @Column({ default: "IN_PROGRESS" })
  status!: string;

  @Column({ type: "json", nullable: false })
  shots: string[] = [];

  @CreateDateColumn()
  createdAt!: Date;

  // Add cascade so ships are automatically persisted
  @OneToMany(() => Ship, (ship) => ship.game, { cascade: true })
  ships!: Ship[];
}
