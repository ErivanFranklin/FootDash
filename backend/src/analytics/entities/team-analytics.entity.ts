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
import { Team } from '../../teams/entities/team.entity';

@Entity({ name: 'team_analytics' })
@Index(['teamId', 'season'], { unique: true })
export class TeamAnalytics {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'team_id' })
  @Index()
  teamId: number;

  @ManyToOne(() => Team, { eager: true })
  @JoinColumn({ name: 'team_id' })
  team: Team;

  @Column({ type: 'varchar', length: 20 })
  season: string; // e.g., "2024", "2024-25"

  @Column({ name: 'form_rating', type: 'decimal', precision: 5, scale: 2, default: 0 })
  formRating: number; // 0-100 rating based on recent results

  @Column({ type: 'simple-json', nullable: true })
  homePerformance: {
    played: number;
    won: number;
    drawn: number;
    lost: number;
    goalsFor: number;
    goalsAgainst: number;
    points: number;
  };

  @Column({ type: 'simple-json', nullable: true })
  awayPerformance: {
    played: number;
    won: number;
    drawn: number;
    lost: number;
    goalsFor: number;
    goalsAgainst: number;
    points: number;
  };

  @Column({ type: 'simple-json', nullable: true })
  scoringTrend: {
    last5Matches: number[]; // goals scored in last 5
    average: number;
    trend: 'up' | 'down' | 'stable';
  };

  @Column({ name: 'defensive_rating', type: 'decimal', precision: 5, scale: 2, default: 0 })
  defensiveRating: number; // Lower is better, goals conceded per match

  @Column({ type: 'simple-json', nullable: true })
  overallStats: {
    totalPlayed: number;
    totalWon: number;
    totalDrawn: number;
    totalLost: number;
    totalGoalsFor: number;
    totalGoalsAgainst: number;
    winPercentage: number;
  };

  @Column({ name: 'last_updated', type: 'timestamp', nullable: true })
  lastUpdated: Date;

  @CreateDateColumn({ name: 'calculated_at' })
  calculatedAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
