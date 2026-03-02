import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'leagues' })
export class League {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', unique: true, comment: 'Football API external league ID' })
  externalId: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 60, nullable: true })
  country: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  logo: string;

  @Column({ type: 'varchar', length: 10, default: '2025' })
  season: string;

  @Column({ type: 'varchar', length: 10, nullable: true, comment: 'League or Cup' })
  type: string;

  @Column({ type: 'boolean', default: false })
  isFeatured: boolean;

  @Column({ type: 'timestamp', nullable: true })
  lastSyncAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
