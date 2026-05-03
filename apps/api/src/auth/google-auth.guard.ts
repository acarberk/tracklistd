import { randomBytes } from 'crypto';

import { type ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import type { FastifyReply, FastifyRequest } from 'fastify';

const STATE_COOKIE = 'oauth_state';
const STATE_PATH = '/auth/google';
const STATE_MAX_AGE_SECONDS = 300;

@Injectable()
export class GoogleStartGuard extends AuthGuard('google') {
  override getAuthenticateOptions(context: ExecutionContext): Record<string, unknown> {
    const res = context.switchToHttp().getResponse<FastifyReply>();
    const state = randomBytes(32).toString('hex');

    void res.header(
      'Set-Cookie',
      [
        `${STATE_COOKIE}=${state}`,
        'HttpOnly',
        `Path=${STATE_PATH}`,
        `Max-Age=${String(STATE_MAX_AGE_SECONDS)}`,
        'SameSite=Lax',
      ].join('; '),
    );

    return { state };
  }
}

@Injectable()
export class GoogleCallbackGuard extends AuthGuard('google') {
  override async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<FastifyRequest>();
    const res = context.switchToHttp().getResponse<FastifyReply>();

    const queryState =
      typeof (req.query as { state?: unknown }).state === 'string'
        ? (req.query as { state: string }).state
        : undefined;
    const cookieState = req.cookies[STATE_COOKIE];

    if (!queryState || !cookieState || queryState !== cookieState) {
      void res.header(
        'Set-Cookie',
        `${STATE_COOKIE}=; HttpOnly; Path=${STATE_PATH}; Max-Age=0; SameSite=Lax`,
      );
      throw new UnauthorizedException({
        code: 'AUTH_OAUTH_INVALID_STATE',
        message: 'OAuth state mismatch',
      });
    }

    void res.header(
      'Set-Cookie',
      `${STATE_COOKIE}=; HttpOnly; Path=${STATE_PATH}; Max-Age=0; SameSite=Lax`,
    );

    return super.canActivate(context) as Promise<boolean>;
  }
}
