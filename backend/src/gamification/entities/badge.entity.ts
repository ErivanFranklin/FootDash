import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable } from 'typeorm';
import { User } from '../../users/user.entity';

@Entity('badges')
export class Badge {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column({ name: 'icon_url' })
  iconUrl: string;

  @Column({ unique: true })
  slug: string;

  @ManyToMany(() => User)
  @JoinTable({
      name: 'user_badges',
      joinColumn: { name: 'badge_id', referencedColumnName: 'id' },
      inverseJoinColumn: { name: 'user_id', referencedColumnName: 'id' }
  })
  users: User[];
}
