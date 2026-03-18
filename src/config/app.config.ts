import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT ?? '3000', 10) || 3000,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  resendApiKey: process.env.RESEND_API_KEY,
  mailFrom: process.env.MAIL_FROM || 'noreply@fxtrading.com',
  fxApiKey: process.env.FX_API_KEY,
  fxBaseUrl: process.env.FX_BASE_URL || 'https://v6.exchangerate-api.com/v6',
  fxCacheTtl: parseInt(process.env.FX_CACHE_TTL_SECONDS ?? '300', 10) || 300,
  redisHost: process.env.REDIS_HOST || 'localhost',
  redisPort: parseInt(process.env.REDIS_PORT ?? '6379', 10) || 6379,
  initialNgnBalance: parseFloat(process.env.INITIAL_NGN_BALANCE ?? '1000') || 1000,
}));
