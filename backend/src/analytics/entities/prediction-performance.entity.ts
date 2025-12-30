import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity({ name: 'prediction_performance' })
@Index(['matchId'])
@Index(['modelType'])
@Index(['predictedAt'])
export class PredictionPerformance {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'match_id' })
  matchId: number;

  @Column({
    type: 'enum',
    enum: ['statistical', 'ml', 'hybrid'],
    name: 'model_type',
  })
  modelType: string;

  @Column({ type: 'simple-json', name: 'prediction_data' })
  prediction: {
    homeWin: number;
    draw: number;
    awayWin: number;
  };

  @Column({
    type: 'enum',
    enum: ['HOME_WIN', 'DRAW', 'AWAY_WIN'],
    nullable: true,
    name: 'actual_outcome',
  })
  actualOutcome?: string;

  @Column({ type: 'boolean', nullable: true, name: 'was_correct' })
  wasCorrect?: boolean;

  @Column({ type: 'float', name: 'confidence_score' })
  confidenceScore: number;

  @Column({ type: 'simple-json', nullable: true })
  metadata?: {
    model_type?: string;
    model_version?: string;
    strategy?: string;
    ml_weight?: number;
    statistical_weight?: number;
    features_used?: string[];
    [key: string]: any;
  };

  @CreateDateColumn({ name: 'predicted_at' })
  predictedAt: Date;

  @Column({ nullable: true, name: 'evaluated_at' })
  evaluatedAt?: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}