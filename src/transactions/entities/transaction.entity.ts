import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum TransactionType {
  FUND = 'fund',
  CONVERT = 'convert',
  TRADE = 'trade',
}

export enum TransactionStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
}

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'enum', enum: TransactionType })
  type: TransactionType;

  @Column({ name: 'from_currency', length: 3 })
  fromCurrency: string;

  @Column({ name: 'to_currency', length: 3, nullable: true })
  toCurrency: string;

  @Column({ name: 'from_amount', type: 'decimal', precision: 18, scale: 6 })
  fromAmount: string; // stored as string to preserve decimal precision from DB

  @Column({ name: 'to_amount', type: 'decimal', precision: 18, scale: 6, nullable: true })
  toAmount: string;

  @Column({ type: 'decimal', precision: 18, scale: 6, nullable: true })
  rate: string;

  @Column({ type: 'enum', enum: TransactionStatus, default: TransactionStatus.PENDING })
  status: TransactionStatus;

  @Column({ name: 'idempotency_key', nullable: true, unique: true })
  idempotencyKey: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
