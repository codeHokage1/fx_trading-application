import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private readonly resend: Resend;

  constructor(
    private readonly config: ConfigService,
    @InjectPinoLogger(MailService.name) private readonly logger: PinoLogger,
  ) {
    this.resend = new Resend(this.config.get<string>('app.resendApiKey'));
  }

  async sendOtp(to: string, otp: string): Promise<void> {
    const { data, error } = await this.resend.emails.send({
      from: this.config.get<string>('app.mailFrom') as string,
      to,
      subject: 'Your FX Trading OTP',
      html: `<p>Your verification code is: <strong>${otp}</strong>. Expires in 10 minutes.</p>`,
    });

    if (error) {
      // Resend returns { data: null, error } on failure — does not throw
      this.logger.error({ err: error, to }, 'Failed to send OTP email');
      throw new InternalServerErrorException('Failed to send verification email');
    }

    this.logger.info({ messageId: data?.id, to }, 'OTP email sent successfully');
  }
}
