import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../user.entity';

export enum Theme {
  LIGHT = 'light',
  DARK = 'dark',
  AUTO = 'auto',
}

export enum Language {
  EN = 'en',
  ES = 'es',
  PT = 'pt',
  FR = 'fr',
}

@Entity({ name: 'user_preferences' })
export class UserPreferences {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id', unique: true })
  userId: number;

  @OneToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @Column({
    type: 'enum',
    enum: Theme,
    default: Theme.AUTO,
  })
  theme: Theme;

  @Column({
    type: 'enum',
    enum: Language,
    default: Language.EN,
  })
  language: Language;

  @Column({ name: 'notification_enabled', default: true })
  notificationEnabled: boolean;

  @Column({ name: 'email_notifications', default: true })
  emailNotifications: boolean;

  @Column({ name: 'push_notifications', default: true })
  pushNotifications: boolean;

  @Column({ type: 'json', name: 'favorite_team_ids', nullable: true })
  favoriteTeamIds: number[] | null;

  @Column({ type: 'varchar', nullable: true, length: 100 })
  timezone: string | null;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
