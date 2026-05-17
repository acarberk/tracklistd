import {
  BadRequestException,
  type CanActivate,
  type ExecutionContext,
  Injectable,
} from '@nestjs/common';

import { TurnstileService } from './turnstile.service';

import type { FastifyRequest } from 'fastify';

@Injectable()
export class TurnstileGuard implements CanActivate {
  constructor(private readonly turnstile: TurnstileService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (!this.turnstile.isEnabled) {
      return true;
    }

    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const body = (request.body ?? {}) as { turnstileToken?: unknown };
    const token = body.turnstileToken;

    if (typeof token !== 'string' || token.length === 0) {
      throw new BadRequestException({
        code: 'AUTH_CAPTCHA_REQUIRED',
        message: 'CAPTCHA token is required',
      });
    }

    const ok = await this.turnstile.verify(token, request.ip);
    if (!ok) {
      throw new BadRequestException({
        code: 'AUTH_CAPTCHA_FAILED',
        message: 'CAPTCHA verification failed',
      });
    }

    return true;
  }
}
