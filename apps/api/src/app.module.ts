import { Module } from '@nestjs/common';

import { ConfigModule } from './config/config.module';
import { HealthModule } from './health/health.module';
import { LoggerModule } from './logger/logger.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [ConfigModule, LoggerModule, PrismaModule, HealthModule],
})
export class AppModule {}
