import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique, UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('wallets')
@Unique(['userId', 'currency'])
export class Wallet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ length: 3 })
  currency: string;

  @Column({ type: 'decimal', precision: 18, scale: 6, default: '0.000000' })
  balance: string; // string to preserve DB decimal precision

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
