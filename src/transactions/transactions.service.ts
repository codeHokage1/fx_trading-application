import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction, TransactionType, TransactionStatus } from './entities/transaction.entity';

interface CreateTransactionDto {
  userId: string;
  type: TransactionType;
  fromCurrency: string;
  toCurrency?: string;
  fromAmount: string;
  toAmount?: string;
  rate?: string;
  status?: TransactionStatus;
  idempotencyKey?: string;
}

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction) private readonly repo: Repository<Transaction>,
  ) {}

  create(data: CreateTransactionDto): Promise<Transaction> {
    return this.repo.save(this.repo.create({
      ...data,
      status: data.status ?? TransactionStatus.SUCCESS,
    }));
  }

  findByUser(userId: string): Promise<Transaction[]> {
    return this.repo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  findByIdempotencyKey(key: string): Promise<Transaction | null> {
    return this.repo.findOne({ where: { idempotencyKey: key } });
  }
}
