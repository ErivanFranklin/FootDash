import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'players' })
export class Player {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'external_id', type: 'int', nullable: true, unique: true })
  externalId?: number | null;

  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ type: 'varchar', length: 5 })
  position: 'GK' | 'DEF' | 'MID' | 'FWD';

  @Column({ name: 'team_name', type: 'varchar', length: 80 })
  teamName: string;

  @Column({ type: 'decimal', precision: 8, scale: 2, default: 5.0 })
  price: number;

  @Column({ type: 'int', default: 60 })
  form: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
