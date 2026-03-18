import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { VerifiedGuard } from '../common/guards/verified.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { WalletService } from './wallet.service';
import { FundWalletDto } from './dto/fund-wallet.dto';
import { ConvertDto } from './dto/convert.dto';
import { TradeDto } from './dto/trade.dto';
import { ConvertSwagger, FundWalletSwagger, GetBalancesSwagger, TradeSwagger } from './wallet.swagger';

@ApiTags('wallet')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, VerifiedGuard)
@Controller('wallet')
export class WalletController {
  constructor(private readonly wallet: WalletService) {}

  @Get()
  @GetBalancesSwagger()
  getBalances(@CurrentUser() user: { id: string }) {
    return this.wallet.getBalances(user.id);
  }

  @Post('fund')
  @FundWalletSwagger()
  fund(@CurrentUser() user: { id: string }, @Body() dto: FundWalletDto) {
    return this.wallet.fund(user.id, dto);
  }

  @Post('convert')
  @ConvertSwagger()
  convert(@CurrentUser() user: { id: string }, @Body() dto: ConvertDto) {
    return this.wallet.convert(user.id, dto);
  }

  @Post('trade')
  @TradeSwagger()
  trade(@CurrentUser() user: { id: string }, @Body() dto: TradeDto) {
    return this.wallet.trade(user.id, dto);
  }
}
