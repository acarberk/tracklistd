import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { type Env } from './env.schema';

@Injectable()
export class EnvService {
  constructor(private readonly configService: ConfigService<Env, true>) {}

  get nodeEnv(): Env['NODE_ENV'] {
    return this.configService.get('NODE_ENV', { infer: true });
  }

  get port(): Env['PORT'] {
    return this.configService.get('PORT', { infer: true });
  }

  get databaseUrl(): Env['DATABASE_URL'] {
    return this.configService.get('DATABASE_URL', { infer: true });
  }

  get redisUrl(): Env['REDIS_URL'] {
    return this.configService.get('REDIS_URL', { infer: true });
  }

  get jwtAccessSecret(): Env['JWT_ACCESS_SECRET'] {
    return this.configService.get('JWT_ACCESS_SECRET', { infer: true });
  }

  get jwtRefreshSecret(): Env['JWT_REFRESH_SECRET'] {
    return this.configService.get('JWT_REFRESH_SECRET', { infer: true });
  }

  get jwtAccessTtl(): Env['JWT_ACCESS_TTL'] {
    return this.configService.get('JWT_ACCESS_TTL', { infer: true });
  }

  get jwtRefreshTtl(): Env['JWT_REFRESH_TTL'] {
    return this.configService.get('JWT_REFRESH_TTL', { infer: true });
  }

  get cookieDomain(): Env['COOKIE_DOMAIN'] {
    return this.configService.get('COOKIE_DOMAIN', { infer: true });
  }

  get mailerDriver(): Env['MAILER_DRIVER'] {
    return this.configService.get('MAILER_DRIVER', { infer: true });
  }

  get mailerFrom(): Env['MAILER_FROM'] {
    return this.configService.get('MAILER_FROM', { infer: true });
  }

  get resendApiKey(): Env['RESEND_API_KEY'] {
    return this.configService.get('RESEND_API_KEY', { infer: true });
  }

  get emailVerificationTtl(): Env['EMAIL_VERIFICATION_TTL'] {
    return this.configService.get('EMAIL_VERIFICATION_TTL', { infer: true });
  }

  get passwordResetTtl(): Env['PASSWORD_RESET_TTL'] {
    return this.configService.get('PASSWORD_RESET_TTL', { infer: true });
  }

  get appBaseUrl(): Env['APP_BASE_URL'] {
    return this.configService.get('APP_BASE_URL', { infer: true });
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  get isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  }
}
