import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  Index,
} from 'typeorm';
import { Match } from '../../matches/entities/match.entity';

export enum PredictionConfidence {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

@Entity({ name: 'match_predictions' })
@Index(['matchId'])
export class MatchPrediction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'match_id' })
  @Index()
  matchId: number;

  @ManyToOne(() => Match, { eager: true })
  @JoinColumn({ name: 'match_id' })
  match: Match;

  @Column({ name: 'home_win_probability', type: 'decimal', precision: 5, scale: 2 })
  homeWinProbability: number;

  @Column({ name: 'draw_probability', type: 'decimal', precision: 5, scale: 2 })
  drawProbability: number;

  @Column({ name: 'away_win_probability', type: 'decimal', precision: 5, scale: 2 })
  awayWinProbability: number;

  @Column({
    type: 'varchar',
    length: 20,
    default: PredictionConfidence.MEDIUM,
  })
  confidence: PredictionConfidence;

  @Column({ type: 'simple-json', nullable: true })
  insights: string[];

  @Column({ type: 'simple-json', nullable: true })
  metadata?: {
    homeFormRating?: number;
    awayFormRating?: number;
    headToHeadWins?: { home: number; away: number; draws: number };
    dataQuality?: string;
  };

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
