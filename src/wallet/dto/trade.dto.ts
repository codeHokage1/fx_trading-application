import {
  IsString,
  IsNumber,
  IsPositive,
  IsOptional,
  IsIn,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SUPPORTED_CURRENCIES } from '../../fx/fx.service';

export class TradeDto {
  @ApiProperty({
    example: 'NGN',
    enum: SUPPORTED_CURRENCIES,
    description: 'Currency to trade from — must be NGN or pair with NGN',
  })
  @IsString()
  @IsIn(SUPPORTED_CURRENCIES)
  fromCurrency: string;

  @ApiProperty({
    example: 'USD',
    enum: SUPPORTED_CURRENCIES,
    description: 'Currency to trade into — must be NGN or pair with NGN',
  })
  @IsString()
  @IsIn(SUPPORTED_CURRENCIES)
  toCurrency: string;

  @ApiProperty({
    example: 50000,
    description: 'Amount of fromCurrency to trade',
  })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiPropertyOptional({
    example: 'trade-2026-001',
    description: 'Unique key to prevent duplicate submissions',
  })
  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}
