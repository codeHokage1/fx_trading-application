import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { VerifiedGuard } from '../common/guards/verified.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { TransactionsService } from './transactions.service';
import { GetHistorySwagger } from './transactions.swagger';
import { PaginationDto } from './dto/pagination.dto';

@ApiTags('transactions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, VerifiedGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactions: TransactionsService) {}

  @Get()
  @GetHistorySwagger()
  getHistory(@CurrentUser() user: { id: string }, @Query() pagination: PaginationDto) {
    return this.transactions.findByUser(user.id, pagination.page, pagination.limit);
  }
}
