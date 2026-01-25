import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'password_hash' })
  password_hash: string;

  @Column({ name: 'is_pro', default: false })
  isPro: boolean;

  @Column({ name: 'stripe_customer_id', nullable: true })
  stripeCustomerId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
