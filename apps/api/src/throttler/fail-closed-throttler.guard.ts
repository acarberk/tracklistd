import {
  type ExecutionContext,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class FailClosedThrottlerGuard extends ThrottlerGuard {
  private readonly logger = new Logger(FailClosedThrottlerGuard.name);

  override async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      return await super.canActivate(context);
    } catch (error) {
      const isThrottle = error instanceof Error && error.name === 'ThrottlerException';
      if (isThrottle) {
        throw error;
      }
      this.logger.error({ event: 'throttler_storage_failure', error });
      throw new ServiceUnavailableException({
        code: 'RATE_LIMIT_UNAVAILABLE',
        message: 'Service temporarily unavailable',
      });
    }
  }
}
