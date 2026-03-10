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

  @Column({
    name: 'external_id',
    type: 'int',
    unique: true,
    comment: 'Football API external league ID',
  })
  externalId: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 60, nullable: true })
  country: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  logo: string;

  @Column({ type: 'varchar', length: 10, default: '2025' })
  season: string;

  @Column({
    type: 'varchar',
    length: 10,
    nullable: true,
    comment: 'League or Cup',
  })
  type: string;

  @Column({ name: 'is_featured', type: 'boolean', default: false })
  isFeatured: boolean;

  @Column({ name: 'last_sync_at', type: 'timestamp', nullable: true })
  lastSyncAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
