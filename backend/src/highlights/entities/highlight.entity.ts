import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'highlights' })
export class Highlight {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  matchId!: number;

  @Column({ nullable: true })
  title!: string;

  @Column({ nullable: true })
  description!: string;

  @Column({ nullable: true })
  thumbnailUrl!: string;

  @Column()
  videoUrl!: string;

  @Column({ default: 'youtube' })
  source!: string;

  @Column({ nullable: true })
  externalId!: string;

  @Column({ default: 0 })
  duration!: number; // seconds

  @Column({ default: 0 })
  viewCount!: number;

  @Column({ nullable: true })
  homeTeam!: string;

  @Column({ nullable: true })
  awayTeam!: string;

  @Column({ nullable: true, type: 'date' })
  matchDate!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
