import { Module } from '@nestjs/common';

import { AuthModule } from './auth/auth.module';
import { ConfigModule } from './config/config.module';
import { HealthModule } from './health/health.module';
import { LoggerModule } from './logger/logger.module';
import { MailerModule } from './mailer/mailer.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { AppThrottlerModule } from './throttler/app-throttler.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    ConfigModule,
    LoggerModule,
    RedisModule,
    AppThrottlerModule,
    PrismaModule,
    MailerModule,
    UserModule,
    AuthModule,
    HealthModule,
  ],
})
export class AppModule {}
