import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'odds' })
export class Odds {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'match_id' })
  matchId!: number;

  @Column({ name: 'home_team', nullable: true })
  homeTeam!: string;

  @Column({ name: 'away_team', nullable: true })
  awayTeam!: string;

  @Column({ name: 'match_date', nullable: true, type: 'date' })
  matchDate!: string;

  @Column()
  bookmaker!: string;

  @Column({ name: 'home_win', type: 'decimal', precision: 5, scale: 2 })
  homeWin!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  draw!: number;

  @Column({ name: 'away_win', type: 'decimal', precision: 5, scale: 2 })
  awayWin!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  over25!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  under25!: number;

  @Column({
    name: 'btts_yes',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  bttsYes!: number;

  @Column({
    name: 'btts_no',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  bttsNo!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
