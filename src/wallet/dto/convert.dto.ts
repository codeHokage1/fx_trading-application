import {
  IsString,
  IsNumber,
  IsPositive,
  IsOptional,
  IsIn,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SUPPORTED_CURRENCIES } from '../../fx/fx.service';

export class ConvertDto {
  @ApiProperty({
    example: 'NGN',
    enum: SUPPORTED_CURRENCIES,
    description: 'Currency to convert from',
  })
  @IsString()
  @IsIn(SUPPORTED_CURRENCIES)
  fromCurrency: string;

  @ApiProperty({
    example: 'USD',
    enum: SUPPORTED_CURRENCIES,
    description: 'Currency to convert to',
  })
  @IsString()
  @IsIn(SUPPORTED_CURRENCIES)
  toCurrency: string;

  @ApiProperty({
    example: 1000,
    description: 'Amount of fromCurrency to convert',
  })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiPropertyOptional({
    example: 'conv-2026-001',
    description: 'Unique key to prevent duplicate submissions',
  })
  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}
