import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from './entities/transaction.entity';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { VerifiedGuard } from '../common/guards/verified.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Transaction])],
  providers: [TransactionsService, VerifiedGuard],
  controllers: [TransactionsController],
  exports: [TransactionsService],
})
export class TransactionsModule {}
