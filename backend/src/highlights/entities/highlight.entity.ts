import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'highlights' })
export class Highlight {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'match_id' })
  matchId!: number;

  @Column({ nullable: true })
  title!: string;

  @Column({ nullable: true })
  description!: string;

  @Column({ name: 'thumbnail_url', nullable: true })
  thumbnailUrl!: string;

  @Column({ name: 'video_url' })
  videoUrl!: string;

  @Column({ default: 'youtube' })
  source!: string;

  @Column({ name: 'external_id', nullable: true })
  externalId!: string;

  @Column({ default: 0 })
  duration!: number; // seconds

  @Column({ name: 'view_count', default: 0 })
  viewCount!: number;

  @Column({ name: 'home_team', nullable: true })
  homeTeam!: string;

  @Column({ name: 'away_team', nullable: true })
  awayTeam!: string;

  @Column({ name: 'match_date', nullable: true, type: 'date' })
  matchDate!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
