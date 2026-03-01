import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Unique,
} from 'typeorm';
import { User } from '../../users/user.entity';

export enum FavoriteEntityType {
  TEAM = 'team',
  MATCH = 'match',
  PLAYER = 'player',
}

@Entity('user_favorites')
@Unique(['userId', 'entityType', 'entityId'])
export class Favorite {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    name: 'entity_type',
    type: 'varchar',
    length: 20,
  })
  entityType: FavoriteEntityType;

  @Column({ name: 'entity_id' })
  entityId: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
