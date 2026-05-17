import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { Prisma, type User } from '@prisma/client';

import { UserService } from '../user/user.service';
import { generateUniqueUsername } from '../user/username-generator';

export interface GoogleProfileInput {
  googleId: string;
  email: string;
  emailVerified: boolean;
  displayName: string;
}

@Injectable()
export class OAuthService {
  private readonly logger = new Logger(OAuthService.name);

  constructor(private readonly users: UserService) {}

  async upsertFromGoogle(input: GoogleProfileInput): Promise<User> {
    const byGoogle = await this.users.findByGoogleId(input.googleId);
    if (byGoogle) {
      return byGoogle;
    }

    const byEmail = await this.users.findByEmail(input.email);
    if (byEmail) {
      if (byEmail.googleId && byEmail.googleId !== input.googleId) {
        this.logger.warn({
          event: 'oauth_conflict',
          provider: 'google',
          userId: byEmail.id,
        });
        throw new ConflictException({
          code: 'INTEGRATION_ALREADY_LINKED',
          message: 'This email is already linked to a different Google account',
        });
      }
      const clearPassword = this.shouldClearPasswordOnLink(byEmail, input);
      if (clearPassword) {
        this.logger.warn({
          event: 'oauth_link_clears_unverified_password',
          provider: 'google',
          userId: byEmail.id,
        });
      }
      return this.users.linkGoogleId(byEmail.id, input.googleId, {
        markEmailVerified: input.emailVerified,
        clearPassword,
      });
    }

    return this.createNewFromGoogleWithRetry(input);
  }

  private shouldClearPasswordOnLink(
    existing: { passwordHash: string | null; emailVerified: boolean },
    input: GoogleProfileInput,
  ): boolean {
    return input.emailVerified && !existing.emailVerified && existing.passwordHash !== null;
  }

  private async createNewFromGoogleWithRetry(
    input: GoogleProfileInput,
    attempt = 0,
  ): Promise<User> {
    const fallback = input.email.split('@')[0] ?? 'user';
    const baseInput = input.displayName.trim().length > 0 ? input.displayName : fallback;

    const username = await generateUniqueUsername(
      baseInput,
      async (candidate) => (await this.users.findByUsername(candidate)) === null,
    );

    try {
      return await this.users.createFromOAuth({
        email: input.email,
        username,
        displayName: input.displayName.trim() || username,
        provider: 'google',
        providerId: input.googleId,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002' &&
        attempt < 2
      ) {
        const existing = await this.users.findByGoogleId(input.googleId);
        if (existing) {
          return existing;
        }
        const byEmail = await this.users.findByEmail(input.email);
        if (byEmail) {
          const clearPassword = this.shouldClearPasswordOnLink(byEmail, input);
          if (clearPassword) {
            this.logger.warn({
              event: 'oauth_link_clears_unverified_password',
              provider: 'google',
              userId: byEmail.id,
            });
          }
          return this.users.linkGoogleId(byEmail.id, input.googleId, {
            markEmailVerified: input.emailVerified,
            clearPassword,
          });
        }
        return this.createNewFromGoogleWithRetry(input, attempt + 1);
      }
      throw error;
    }
  }
}
