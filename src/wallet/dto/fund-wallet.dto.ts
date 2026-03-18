import { IsNumber, IsPositive, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FundWalletDto {
  @ApiProperty({
    example: 50000,
    description: 'Amount in NGN to credit to wallet',
  })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiPropertyOptional({
    example: 'fund-txn-2026-001',
    description: 'Unique key to prevent duplicate submissions',
  })
  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}
