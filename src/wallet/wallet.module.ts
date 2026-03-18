import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Wallet } from './entities/wallet.entity';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { FxModule } from '../fx/fx.module';
import { TransactionsModule } from '../transactions/transactions.module';
import { VerifiedGuard } from '../common/guards/verified.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Wallet]),
    FxModule,
    TransactionsModule,
  ],
  providers: [WalletService, VerifiedGuard],
  controllers: [WalletController],
  exports: [WalletService],
})
export class WalletModule {}
