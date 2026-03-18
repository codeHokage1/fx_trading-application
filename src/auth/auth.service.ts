import {
  Injectable, BadRequestException, UnauthorizedException, ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import { WalletService } from '../wallet/wallet.service';
import { RegisterDto } from './dto/register.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly mail: MailService,
    private readonly config: ConfigService,
    private readonly wallet: WalletService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.users.findByEmail(dto.email);
    if (existing) throw new ConflictException('Email already registered');

    const password = await bcrypt.hash(dto.password, 10);
    const otp = this.generateOtp();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    const user = await this.users.create({ email: dto.email, password, otp, otpExpiresAt });
    await this.wallet.initializeWallet(user.id);
    await this.mail.sendOtp(dto.email, otp);

    return { message: 'Registration successful. Check your email for the OTP.' };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const user = await this.users.findByEmail(dto.email);
    if (!user) throw new BadRequestException('User not found');
    if (user.isVerified) throw new BadRequestException('Account already verified');
    if (!user.otp || user.otp !== dto.otp) throw new BadRequestException('Invalid OTP');
    if (user.otpExpiresAt < new Date()) throw new BadRequestException('OTP expired');

    await this.users.update(user.id, { isVerified: true, otp: undefined, otpExpiresAt: undefined });
    return { message: 'Email verified successfully' };
  }

  async login(dto: LoginDto) {
    const user = await this.users.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    if (!user.isVerified) throw new UnauthorizedException('Please verify your email first');

    const token = this.jwt.sign({ sub: user.id, email: user.email });
    return { accessToken: token };
  }

  private generateOtp(): string {
    // 6-digit numeric OTP
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}
