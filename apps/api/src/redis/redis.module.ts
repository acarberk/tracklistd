import { Global, Inject, Module, type OnApplicationShutdown, type Provider } from '@nestjs/common';
import Redis from 'ioredis';

import { ConfigModule } from '../config/config.module';
import { EnvService } from '../config/env.service';

export const REDIS_CLIENT = Symbol('REDIS_CLIENT');

const QUIT_TIMEOUT_MS = 5_000;

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
    const quit = this.redis.quit().then(() => undefined);
    const timeout = new Promise<void>((resolve) => {
      setTimeout(resolve, QUIT_TIMEOUT_MS);
    });

    try {
      await Promise.race([quit, timeout]);
    } finally {
      this.redis.disconnect();
    }
  }
}
