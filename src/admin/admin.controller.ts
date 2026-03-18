import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { AdminService } from './admin.service';
import { PaginationDto } from '../transactions/dto/pagination.dto';
import { AdminTransactionsQueryDto } from './dto/admin-transactions-query.dto';
import { GetAnalyticsSwagger, GetAllTransactionsSwagger, GetAllUsersSwagger } from './admin.swagger';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('analytics')
  @GetAnalyticsSwagger()
  getAnalytics() {
    return this.admin.getAnalytics();
  }

  @Get('users')
  @GetAllUsersSwagger()
  getUsers(@Query() pagination: PaginationDto) {
    return this.admin.getAllUsers(pagination.page, pagination.limit);
  }

  @Get('transactions')
  @GetAllTransactionsSwagger()
  getTransactions(@Query() query: AdminTransactionsQueryDto) {
    return this.admin.getAllTransactions(query.page, query.limit, query.type);
  }
}
