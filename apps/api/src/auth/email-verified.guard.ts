import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import { type AuthenticatedRequest } from './types';

@Injectable()
export class EmailVerifiedGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!request.user.emailVerified) {
      throw new ForbiddenException({
        code: 'AUTH_EMAIL_NOT_VERIFIED',
        message: 'Email verification required',
      });
    }
    return true;
  }
}
