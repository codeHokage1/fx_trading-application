import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResendOtpDto {
  @ApiProperty({ example: 'john.doe@gmail.com' })
  @IsEmail()
  email: string;
}
