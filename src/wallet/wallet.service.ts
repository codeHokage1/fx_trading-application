import {
  Injectable, BadRequestException, NotFoundException, ConflictException, Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import Decimal from 'decimal.js';
import { ConfigService } from '@nestjs/config';
import { Wallet } from './entities/wallet.entity';
import { FxService } from '../fx/fx.service';
import { TransactionsService } from '../transactions/transactions.service';
import { TransactionType } from '../transactions/entities/transaction.entity';
import { FundWalletDto } from './dto/fund-wallet.dto';
import { ConvertDto } from './dto/convert.dto';
import { TradeDto } from './dto/trade.dto';

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  constructor(
    @InjectRepository(Wallet) private readonly repo: Repository<Wallet>,
    private readonly dataSource: DataSource,
    private readonly fx: FxService,
    private readonly transactions: TransactionsService,
    private readonly config: ConfigService,
  ) {}

  // Called during user registration to seed NGN wallet
  async initializeWallet(userId: string): Promise<void> {
    const initialBalance = this.config.get<number>('app.initialNgnBalance') ?? 1000;
    const wallet = this.repo.create({ userId, currency: 'NGN', balance: String(initialBalance) });
    await this.repo.save(wallet);
  }

  async getBalances(userId: string): Promise<Wallet[]> {
    return this.repo.find({ where: { userId } });
  }

  async fund(userId: string, dto: FundWalletDto): Promise<Wallet> {
    // Idempotency check
    if (dto.idempotencyKey) {
      const existing = await this.transactions.findByIdempotencyKey(dto.idempotencyKey);
      if (existing) throw new ConflictException('Duplicate request — transaction already processed');
    }

    return this.dataSource.transaction(async (manager) => {
      // Lock the NGN wallet row for this user
      let wallet = await manager
        .getRepository(Wallet)
        .createQueryBuilder('w')
        .setLock('pessimistic_write')
        .where('w.user_id = :userId AND w.currency = :currency', { userId, currency: 'NGN' })
        .getOne();

      if (!wallet) {
        // Create NGN wallet if somehow missing
        wallet = manager.getRepository(Wallet).create({ userId, currency: 'NGN', balance: '0' });
      }

      wallet.balance = new Decimal(wallet.balance).plus(dto.amount).toFixed(6);
      await manager.getRepository(Wallet).save(wallet);

      await this.transactions.create({
        userId,
        type: TransactionType.FUND,
        fromCurrency: 'NGN',
        fromAmount: String(dto.amount),
        idempotencyKey: dto.idempotencyKey,
      });

      return wallet;
    });
  }

  async convert(userId: string, dto: ConvertDto): Promise<Wallet> {
    if (dto.fromCurrency === dto.toCurrency) {
      throw new BadRequestException('From and to currencies must differ');
    }

    if (dto.idempotencyKey) {
      const existing = await this.transactions.findByIdempotencyKey(dto.idempotencyKey);
      if (existing) throw new ConflictException('Duplicate request');
    }

    const rate = await this.fx.getRate(dto.fromCurrency, dto.toCurrency);
    const toAmount = new Decimal(dto.amount).mul(rate).toFixed(6);

    return this.dataSource.transaction(async (manager) => {
      const walletRepo = manager.getRepository(Wallet);

      // Lock both wallets to prevent race conditions
      const fromWallet = await walletRepo
        .createQueryBuilder('w')
        .setLock('pessimistic_write')
        .where('w.user_id = :userId AND w.currency = :currency', { userId, currency: dto.fromCurrency })
        .getOne();

      if (!fromWallet) throw new NotFoundException(`No ${dto.fromCurrency} wallet found`);

      const fromBalance = new Decimal(fromWallet.balance);
      if (fromBalance.lessThan(dto.amount)) {
        throw new BadRequestException(`Insufficient ${dto.fromCurrency} balance`);
      }

      // Deduct from source wallet
      fromWallet.balance = fromBalance.minus(dto.amount).toFixed(6);
      await walletRepo.save(fromWallet);

      // Credit destination wallet (create if first time holding this currency)
      let toWallet = await walletRepo
        .createQueryBuilder('w')
        .setLock('pessimistic_write')
        .where('w.user_id = :userId AND w.currency = :currency', { userId, currency: dto.toCurrency })
        .getOne();

      if (!toWallet) {
        toWallet = walletRepo.create({ userId, currency: dto.toCurrency, balance: '0' });
      }

      toWallet.balance = new Decimal(toWallet.balance).plus(toAmount).toFixed(6);
      await walletRepo.save(toWallet);

      await this.transactions.create({
        userId,
        type: TransactionType.CONVERT,
        fromCurrency: dto.fromCurrency,
        toCurrency: dto.toCurrency,
        fromAmount: String(dto.amount),
        toAmount,
        rate: String(rate),
        idempotencyKey: dto.idempotencyKey,
      });

      return toWallet;
    });
  }

  async trade(userId: string, dto: TradeDto): Promise<Wallet> {
    // Trade enforces NGN must be one side of the pair
    const involvesSNGN = dto.fromCurrency === 'NGN' || dto.toCurrency === 'NGN';
    if (!involvesSNGN) {
      throw new BadRequestException('Trade must involve NGN on one side');
    }

    if (dto.idempotencyKey) {
      const existing = await this.transactions.findByIdempotencyKey(dto.idempotencyKey);
      if (existing) throw new ConflictException('Duplicate request');
    }

    const rate = await this.fx.getRate(dto.fromCurrency, dto.toCurrency);
    const toAmount = new Decimal(dto.amount).mul(rate).toFixed(6);

    return this.dataSource.transaction(async (manager) => {
      const walletRepo = manager.getRepository(Wallet);

      const fromWallet = await walletRepo
        .createQueryBuilder('w')
        .setLock('pessimistic_write')
        .where('w.user_id = :userId AND w.currency = :currency', { userId, currency: dto.fromCurrency })
        .getOne();

      if (!fromWallet) throw new NotFoundException(`No ${dto.fromCurrency} wallet found`);

      const fromBalance = new Decimal(fromWallet.balance);
      if (fromBalance.lessThan(dto.amount)) {
        throw new BadRequestException(`Insufficient ${dto.fromCurrency} balance`);
      }

      fromWallet.balance = fromBalance.minus(dto.amount).toFixed(6);
      await walletRepo.save(fromWallet);

      let toWallet = await walletRepo
        .createQueryBuilder('w')
        .setLock('pessimistic_write')
        .where('w.user_id = :userId AND w.currency = :currency', { userId, currency: dto.toCurrency })
        .getOne();

      if (!toWallet) {
        toWallet = walletRepo.create({ userId, currency: dto.toCurrency, balance: '0' });
      }

      toWallet.balance = new Decimal(toWallet.balance).plus(toAmount).toFixed(6);
      await walletRepo.save(toWallet);

      await this.transactions.create({
        userId,
        type: TransactionType.TRADE,
        fromCurrency: dto.fromCurrency,
        toCurrency: dto.toCurrency,
        fromAmount: String(dto.amount),
        toAmount,
        rate: String(rate),
        idempotencyKey: dto.idempotencyKey,
      });

      return toWallet;
    });
  }
}
