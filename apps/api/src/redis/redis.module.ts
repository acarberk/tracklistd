import { Global, Inject, Module, type OnApplicationShutdown, type Provider } from '@nestjs/common';
import Redis from 'ioredis';

import { ConfigModule } from '../config/config.module';
import { EnvService } from '../config/env.service';

export const REDIS_CLIENT = Symbol('REDIS_CLIENT');

const redisProvider: Provider = {
  provide: REDIS_CLIENT,
  inject: [EnvService],
  useFactory: (env: EnvService): Redis => {
    return new Redis(env.redisUrl, {
      maxRetriesPerRequest: 3,
      lazyConnect: false,
    });
  },
};

@Global()
@Module({
  imports: [ConfigModule],
  providers: [redisProvider],
  exports: [redisProvider],
})
export class RedisModule implements OnApplicationShutdown {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async onApplicationShutdown(): Promise<void> {
    await this.redis.quit();
  }
}
