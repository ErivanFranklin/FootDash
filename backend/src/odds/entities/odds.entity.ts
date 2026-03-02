import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'odds' })
export class Odds {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  matchId!: number;

  @Column({ nullable: true })
  homeTeam!: string;

  @Column({ nullable: true })
  awayTeam!: string;

  @Column({ nullable: true, type: 'date' })
  matchDate!: string;

  @Column()
  bookmaker!: string;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  homeWin!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  draw!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  awayWin!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  over25!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  under25!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  bttsYes!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  bttsNo!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
