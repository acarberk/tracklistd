import { randomBytes } from 'crypto';

import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { EnvService } from '../config/env.service';

import type { FastifyReply, FastifyRequest } from 'fastify';

const STATE_COOKIE = 'oauth_state';
const STATE_PATH = '/auth/google';
const STATE_MAX_AGE_SECONDS = 300;

@Injectable()
export class GoogleOAuthConfiguredGuard implements CanActivate {
  constructor(private readonly env: EnvService) {}

  canActivate(): boolean {
    if (!this.env.isGoogleOAuthConfigured) {
      throw new ServiceUnavailableException({
        code: 'AUTH_OAUTH_NOT_CONFIGURED',
        message: 'Google OAuth is not configured on this server',
      });
    }
    return true;
  }
}

function buildStateCookie(value: string, maxAgeSeconds: number, isProduction: boolean): string {
  const parts = [
    `${STATE_COOKIE}=${value}`,
    'HttpOnly',
    `Path=${STATE_PATH}`,
    `Max-Age=${String(maxAgeSeconds)}`,
    'SameSite=Lax',
  ];
  if (isProduction) {
    parts.push('Secure');
  }
  return parts.join('; ');
}

@Injectable()
export class GoogleStartGuard extends AuthGuard('google') {
  constructor(private readonly env: EnvService) {
    super();
  }

  override getAuthenticateOptions(context: ExecutionContext): Record<string, unknown> {
    const res = context.switchToHttp().getResponse<FastifyReply>();
    const state = randomBytes(32).toString('hex');

    void res.header(
      'Set-Cookie',
      buildStateCookie(state, STATE_MAX_AGE_SECONDS, this.env.isProduction),
    );

    return { state };
  }
}

@Injectable()
export class GoogleCallbackGuard extends AuthGuard('google') {
  constructor(private readonly env: EnvService) {
    super();
  }

  override async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<FastifyRequest>();
    const res = context.switchToHttp().getResponse<FastifyReply>();

    const queryState =
      typeof (req.query as { state?: unknown }).state === 'string'
        ? (req.query as { state: string }).state
        : undefined;
    const cookieState = req.cookies[STATE_COOKIE];
    const clearCookie = buildStateCookie('', 0, this.env.isProduction);

    if (!queryState || !cookieState || queryState !== cookieState) {
      void res.header('Set-Cookie', clearCookie);
      throw new UnauthorizedException({
        code: 'AUTH_OAUTH_INVALID_STATE',
        message: 'OAuth state mismatch',
      });
    }

    void res.header('Set-Cookie', clearCookie);

    return super.canActivate(context) as Promise<boolean>;
  }
}
