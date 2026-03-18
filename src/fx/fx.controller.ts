import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { FxService, RateMap } from './fx.service';
import { GetRatesSwagger } from './fx.swagger';

@ApiTags('fx')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('fx')
export class FxController {
  constructor(private readonly fx: FxService) {}

  @Get('rates')
  @GetRatesSwagger()
  getRates(): Promise<RateMap> {
    return this.fx.getRates();
  }
}
