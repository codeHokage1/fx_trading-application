import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Wallet } from '../wallet/entities/wallet.entity';
import { Transaction, TransactionType } from '../transactions/entities/transaction.entity';
import Decimal from 'decimal.js';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Wallet) private readonly wallets: Repository<Wallet>,
    @InjectRepository(Transaction) private readonly transactions: Repository<Transaction>,
  ) {}

  async getAnalytics() {
    const [totalUsers, verifiedUsers] = await Promise.all([
      this.users.count(),
      this.users.count({ where: { isVerified: true } }),
    ]);

    // transaction counts and volumes by type
    const txStats = await this.transactions
      .createQueryBuilder('t')
      .select('t.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .addSelect('SUM(CAST(t.from_amount AS DECIMAL))', 'totalVolume')
      .groupBy('t.type')
      .getRawMany<{ type: TransactionType; count: string; totalVolume: string }>();

    // total balance held per currency across all users
    const walletStats = await this.wallets
      .createQueryBuilder('w')
      .select('w.currency', 'currency')
      .addSelect('SUM(CAST(w.balance AS DECIMAL))', 'totalBalance')
      .addSelect('COUNT(*)', 'walletCount')
      .groupBy('w.currency')
      .getRawMany<{ currency: string; totalBalance: string; walletCount: string }>();

    // top 5 most active users by transaction count
    const topUsers = await this.transactions
      .createQueryBuilder('t')
      .select('t.user_id', 'userId')
      .addSelect('COUNT(*)', 'txCount')
      .groupBy('t.user_id')
      .orderBy('COUNT(*)', 'DESC')
      .limit(5)
      .getRawMany<{ userId: string; txCount: string }>();

    return {
      users: {
        total: totalUsers,
        verified: verifiedUsers,
        unverified: totalUsers - verifiedUsers,
      },
      transactions: txStats.map((s) => ({
        type: s.type,
        count: parseInt(s.count),
        totalVolume: new Decimal(s.totalVolume || 0).toFixed(2),
      })),
      wallets: walletStats.map((w) => ({
        currency: w.currency,
        totalBalance: new Decimal(w.totalBalance || 0).toFixed(2),
        walletCount: parseInt(w.walletCount),
      })),
      topActiveUsers: topUsers.map((u) => ({
        userId: u.userId,
        transactionCount: parseInt(u.txCount),
      })),
    };
  }

  getAllUsers(page = 1, limit = 20) {
    return this.users.findAndCount({
      select: ['id', 'email', 'isVerified', 'role', 'createdAt'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    }).then(([data, total]) => ({ data, total, page, limit }));
  }

  getAllTransactions(page = 1, limit = 20, type?: TransactionType) {
    return this.transactions.findAndCount({
      where: type ? { type } : {},
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    }).then(([data, total]) => ({ data, total, page, limit }));
  }
}
