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

  async findByUser(userId: string, page = 1, limit = 20): Promise<{ data: Transaction[]; total: number; page: number; limit: number }> {
    const [data, total] = await this.repo.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit };
  }

  findByIdempotencyKey(key: string): Promise<Transaction | null> {
    return this.repo.findOne({ where: { idempotencyKey: key } });
  }
}
